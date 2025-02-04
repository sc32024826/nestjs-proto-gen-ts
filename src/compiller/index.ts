import protobufjs from 'protobufjs';
import { basename, dirname, extname, isAbsolute, join, resolve } from 'path';
import fse from 'fs-extra';
import handlebars from 'handlebars';
import chalk from 'chalk';

import './handlebars/var-helper.js';
import './handlebars/comment-helper.js';
import './handlebars/enum-comment-helper.js';
import './handlebars/uncapitalize-hepler.js';
import './handlebars/type-helper.js';
import './handlebars/default-value-helper.js';

import { IGenOptions } from '../types.js';

import { fileURLToPath } from 'url';
import { dirname as dir } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dir(__filename);

const { existsSync, lstatSync, outputFileSync, readdirSync, readFileSync } = fse

/** Set Compiller */
export class Compiller {
    constructor(private readonly options: IGenOptions) { }

    public compile(): void {
        this.options.path.forEach((pkg) => {
            if (this.options.path.length === 1) {
                this.getProtoFiles(pkg);
            }
        });
    }

    private resolveRootPath(root: protobufjs.Root): void {
        const paths = this.options.path;
        const length = paths.length;

        // Search include paths when resolving imports
        root.resolvePath = (origin, target) => {
            let resolved = protobufjs.util.path.resolve(protobufjs.util.path.normalize(origin), protobufjs.util.path.normalize(target), false);

            const idx = resolved.lastIndexOf('google/protobuf/');

            if (idx > -1) {
                const altname = resolved.substring(idx);

                if (resolved.match(/google\/protobuf\//g)) {
                    const matches = resolved.match(/google\/protobuf\//g);
                    if (matches && matches.length > 1) {
                        resolved = resolved.split('google/protobuf')[0] + protobufjs.util.path.normalize(target);
                    }
                }

                if (altname in protobufjs.common) {
                    resolved = altname;
                }
            }

            if (existsSync(resolved)) {
                return resolved;
            }

            for (let i = 0; i < length; ++i) {
                const iresolved = protobufjs.util.path.resolve(paths[i] + '/', target);

                if (existsSync(iresolved)) {
                    return iresolved;
                }
            }

            return resolved;
        };
    }

    private walkTree(item: protobufjs.Root | any): void {
        if (item.nested) {
            Object.keys(item.nested).forEach((key) => {
                this.walkTree(item.nested[key]);
            });
        }

        if (item.fields) {
            Object.keys(item.fields).forEach((key) => {
                const field = item.fields[key];

                if (field.resolvedType) {
                    // Record the field's parent name
                    if (field.resolvedType.parent) {
                        // Abuse the options object!
                        if (!field.options) {
                            field.options = {};
                        }

                        if (field.type.indexOf('.') === -1) {
                            field.options.parent = field.resolvedType.parent.name;
                        }
                    }

                    // Record if the field is an enum
                    if (field.resolvedType instanceof protobufjs.Enum) {
                        // Abuse the options object!
                        if (!field.options) {
                            field.options = {};
                        }

                        field.options.enum = true;
                    }
                }
            });
        }
    }

    private output(file: string, pkg: string, tmpl: string): void {
        const root = new protobufjs.Root();

        this.resolveRootPath(root);

        root.loadSync(file, {
            keepCase: this.options.keepCase,
            alternateCommentMode: this.options.comments
        }).resolveAll();

        this.walkTree(root);

        const results = handlebars.compile(tmpl)(root);
        const outputFile = this.options.output ? join(this.options.output, file.replace(/^.+?[/\\]/, '')) : file;
        const outputPath = join(dirname(outputFile), `${basename(file, extname(file))}.ts`);

        outputFileSync(outputPath, results, 'utf8');
    }

    private generate(path: string, pkg: string): void {
        let hbTemplate = resolve(__dirname, '../..', this.options.template || '');

        //If absolute path we will know have custom template option
        if (isAbsolute(path)) {
            hbTemplate = path;
        }

        if (!existsSync(hbTemplate)) {
            throw new Error(`Template ${hbTemplate} is not found`);
        }

        const tmpl = readFileSync(hbTemplate, 'utf8');

        if (this.options.verbose) {
            console.log(chalk.blueBright(`-- found: `) + chalk.gray(path));
        }

        this.output(path, pkg, tmpl);
    }

    private getProtoFiles(pkg: string): void {
        if (!existsSync(pkg)) {
            throw new Error(`Directory ${pkg} is not exist`);
        }

        const files = readdirSync(pkg);

        for (let i = 0; i < files.length; i++) {
            const filename = join(pkg, files[i]);
            const stat = lstatSync(filename);

            if (filename.indexOf(this.options.ignore.join()) > -1) {
                continue;
            }

            if (stat.isDirectory()) {
                this.getProtoFiles(filename);
            } else if (filename.indexOf(this.options.target.join()) > -1) {
                this.generate(filename, pkg);
            }
        }
    }
}
