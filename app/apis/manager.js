/* eslint-disable */

/* eslint-disable */

// NPM cli commands

import cp from 'child_process';
import Q from 'q';
import path from 'path';
import chalk from 'chalk';
import mk from '../mk';

mk.logToFile = false;

const { spawn } = cp;
const { log } = console;
const { config } = mk;
const {
  defaultSettings: { manager }
} = config;

const cwd = process.cwd();
const deferred = Q.defer();

const __directory = '/home/rvpanoz/Projects/electron/luna-test/package.json';

const execute = (
  manager = activeManager,
  commandArgs,
  directory = __directory,
  callback,
  opts
) => {
  log(chalk.white.bold(`running: ${manager} ${commandArgs.join(' ')}`));

  const { latest } = opts || {};
  let result = '';
  let error = '';

  // on windows use npm.cmd
  const command = spawn(
    /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
    commandArgs,
    {
      env: process.env,
      cwd: directory ? path.dirname(directory) : cwd
    }
  );

  command.stdout.on('data', data => {
    const dataToString = data.toString();

    result += dataToString;
    callback('stdout', commandArgs, dataToString);
  });

  command.stderr.on('data', err => {
    const errorToString = err.toString();

    error += `${errorToString} | `;
    callback('error', commandArgs, errorToString);
  });

  command.on('exit', code => {
    log(chalk.greenBright.bold(`child exited with code ${code}`));
  });

  command.on('close', () => {
    log(chalk.green.bold(`finished: ${manager} ${commandArgs.join(' ')}`));

    const results = {
      status: 'close',
      error: error.length ? error : null,
      data: result,
      cmd: commandArgs,
      latest
    };

    deferred.resolve(results);
  });

  return deferred.promise;
};

/**
 * List command
 *
 * */

exports.list = (opts, callback) => {
  const command = ['list'];
  const { mode, directory, manager } = opts;
  const defaults = ['--long', '--json', '--depth=0', '--parseable'];

  if (!callback || typeof callback !== 'function') {
    return Q.reject(
      new Error(
        `${manager}[list] callback parameter must be given and must be a function`
      )
    );
  }

  const commandArgs = mode === 'GLOBAL' ? [].concat(defaults, '-g') : defaults;
  const run = [].concat(command).concat(commandArgs.reverse());

  return execute(manager, run, directory, callback);
};