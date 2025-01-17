import yargs from 'yargs';
import chalk from 'chalk';
import { resolve } from 'path';

import { options } from '../options.js';
import { Compiller } from '../compiller/index.js';

/** Set CLI */
async function initializeCli() {
    const cli = await yargs('Extract and merge locale files.\nUsage: $0 [options]')
        /* eslint-disable @typescript-eslint/no-var-requires */
        .version(require(`${__dirname}/../../package.json`).version)
        /* eslint-enable @typescript-eslint/no-var-requires */
        .alias('version', 'v')
        .help('help')
        .alias('help', 'h')
        .option('path', {
            alias: 'p',
            describe: 'Path to root directory',
            type: 'array',
            normalize: true
        })
        .option('output', {
            alias: 'o',
            describe: 'Path to output directory',
            type: 'string',
            default: options.output,
            normalize: true
        })
        .option('template', {
            describe: "Handlebar's template for output",
            type: 'string'
        })
        .option('target', {
            alias: 't',
            describe: 'Proto files',
            default: options.target,
            type: 'array',
            coerce: (arg) => {
                return Array.isArray(arg) ? arg.map(String) : [String(arg)];
            }
        })
        .option('ignore', {
            alias: 'i',
            describe: 'Ignore file or directories',
            default: options.ignore,
            type: 'array',
            coerce: (arg) => {
                return Array.isArray(arg) ? arg.map(String) : [String(arg)];
            }
        })
        .option('comments', {
            alias: 'c',
            describe: 'Add comments from proto',
            default: options.comments,
            type: 'boolean'
        })
        .option('verbose', {
            describe: 'Log all output to console',
            default: options.verbose,
            type: 'boolean'
        })
        .option('keepCase', {
            aslias: 'k',
            describe: 'Keeps field casing instead of converting to camel case',
            default: options.keepCase,
            type: 'boolean'
        })
        .demandOption(['path'], chalk.red.bold('Please provide both run and [path] argument to work with this tool'))
        .exitProcess(true)
        .parse(process.argv);

    if (cli?.template) {
        cli.template = resolve(process.cwd(), cli.template);
    }

    /**
     * Init Compiller
     *
     * @type {Compiller}
     * @param {IGenOptions}
     */
    const compiller = new Compiller({ ...options, ...cli });

    /** CLI Task Run */
    compiller.compile();
}

initializeCli();
