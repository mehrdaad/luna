/* eslint-disable */

/**
 * Toolbar
 */

import { ipcRenderer } from 'electron';
import React, { useState, useEffect } from 'react';
import cn from 'classnames';
import { useDispatch } from 'redux-react-hook';
import { remote } from 'electron';
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Popover from '@material-ui/core/Popover';
import RefreshIcon from '@material-ui/icons/Refresh';
import FilterListIcon from '@material-ui/icons/FilterList';
import InstallIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import LoadIcon from '@material-ui/icons/Archive';
import PublicIcon from '@material-ui/icons/PublicRounded';
import Snackbar from '@material-ui/core/Snackbar';

import { setMode } from 'models/ui/actions';
import { APP_MODES } from 'constants/AppConstants';

import SnackbarContent from 'components/layout/SnackbarContent';
import TableFilters from './TableFilters';

import { tableToolbarStyles as styles } from '../styles/packagesStyles';

const installSelected = (manager, mode, directory, selected) => {
  ipcRenderer.send('ipc-event', {
    activeManager: manager,
    ipcEvent: 'install-packages',
    cmd: ['install'],
    multiple: true,
    packages: selected,
    mode,
    directory
  });
};

const uninstallSelected = (manager, mode, directory, selected) => {
  ipcRenderer.send('ipc-event', {
    activeManager: manager,
    ipcEvent: 'uninstall-packages',
    cmd: ['uninstall'],
    multiple: true,
    packages: selected,
    mode,
    directory
  });
};

const TableListToolbar = props => {
  const { classes, selected, title, manager, reload, mode, fromSearch } = props;
  const [snackbarOpen, toggleSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [counter, setCounter] = useState(0);
  const [filtersOn, toggleFilters] = useState(false);

  const dispatch = useDispatch();

  const switchMode = (mode, directory) => {
    dispatch(setMode({ mode, directory }));

    if (fromSearch) {
      reload();
    }
  };

  const openFilters = (e, close) => {
    setAnchorEl(close ? null : e.target);
    toggleFilters(!filtersOn);
  };

  const openPackage = () => {
    remote.dialog.showOpenDialog(
      remote.getCurrentWindow(),
      {
        title: 'Open package.json file',
        buttonLabel: 'Analyze',
        filters: [
          {
            name: 'package.json',
            extensions: ['json']
          }
        ],
        properties: ['openFile']
      },
      filePath => {
        if (filePath) {
          const directory = filePath.join('');
          switchMode(APP_MODES.LOCAL, directory);
        }
      }
    );
  };

  const handleUninstall = () => {
    const { mode, directory, selected } = props;

    if (selected && selected.length) {
      remote.dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
          title: 'Confirmation',
          type: 'question',
          message: 'Would you like to uninstall the selected packages?',
          buttons: ['Cancel', 'Uninstall']
        },
        btnIdx => {
          if (Boolean(btnIdx) === true) {
            uninstallSelected(manager, mode, directory, selected);
          }
        }
      );
    }
    return false;
  };

  const handleInstall = () => {
    const { mode, directory, selected } = props;

    if (selected && selected.length) {
      remote.dialog.showMessageBox(
        remote.getCurrentWindow(),
        {
          title: 'Confirmation',
          type: 'question',
          message: 'Would you like to install the selected packages?',
          buttons: ['Cancel', 'Install']
        },
        btnIdx => {
          if (Boolean(btnIdx) === true) {
            installSelected(manager, mode, directory, selected);
          }
        }
      );
    }
    return false;
  };

  const renderToolbarActions = () => (
    <div className={classes.flexContainer}>
      <Tooltip title="Open package.json">
        <IconButton
          color="secondary"
          aria-label="Open package.json"
          onClick={e => openPackage()}
        >
          <LoadIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Show global packages">
        <div>
          <IconButton
            disabled={mode === APP_MODES.GLOBAL && !fromSearch}
            aria-label="Show globals"
            onClick={e => switchMode(APP_MODES.GLOBAL, null)}
          >
            <PublicIcon />
          </IconButton>
        </div>
      </Tooltip>
      <Tooltip title={fromSearch ? 'Back to list' : 'Reload list'}>
        <div>
          <IconButton
            aria-label={fromSearch ? 'Back to list' : 'Reload list'}
            onClick={() => reload()}
          >
            <RefreshIcon />
          </IconButton>
        </div>
      </Tooltip>
      <Tooltip title="Show filters">
        <IconButton aria-label="Show filters" onClick={openFilters}>
          <FilterListIcon />
        </IconButton>
      </Tooltip>
    </div>
  );

  useEffect(
    () => {
      ipcRenderer.on('install-packages-close', (event, status, error, data) => {
        setSnackbarMessage(data);
        toggleSnackbar(true);
      });

      ipcRenderer.on(
        'uninstall-packages-close',
        (event, status, error, data) => {
          setSnackbarMessage(data);
          toggleSnackbar(true);
        }
      );
    },
    [counter]
  );

  useEffect(() => () =>
    ipcRenderer.removeAllListeners([
      'install-packages-close',
      'uninstall-packages-close'
    ])
  );

  return (
    <section className={classes.root}>
      <Toolbar
        disableGutters={true}
        className={cn({
          [classes.highlight]: selected.length > 0
        })}
      >
        <div className={classes.header}>
          <Typography color="primary" component="h1" variant="title">
            {selected && selected.length === 0
              ? title
              : `${selected.length} selected`}
          </Typography>
        </div>
        <div className={classes.filters}>
          <Popover
            open={filtersOn}
            anchorEl={anchorEl}
            onClose={e => toggleFilters(!filtersOn)}
          >
            <TableFilters mode={mode} close={() => openFilters(null, true)} />
          </Popover>
        </div>
        <div className={classes.spacer} />
        <div className={classes.actions}>
          {selected.length === 0 ? (
            renderToolbarActions()
          ) : fromSearch ? (
            <div className={classes.flexContainer}>
              <Tooltip title="Install selected">
                <IconButton
                  aria-label="install selected"
                  onClick={e => handleInstall()}
                >
                  <InstallIcon />
                </IconButton>
              </Tooltip>
            </div>
          ) : (
            <div className={classes.flexContainer}>
              <Tooltip title="Uninstall selected">
                <IconButton
                  aria-label="uninstall selected"
                  onClick={e => handleUninstall()}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>
      </Toolbar>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => toggleSnackbar(false)}
      >
        <SnackbarContent
          onClose={() => toggleSnackbar(false)}
          variant="success"
          message={snackbarMessage}
        />
      </Snackbar>
    </section>
  );
};

TableListToolbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(TableListToolbar);
