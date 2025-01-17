import { IGenOptions } from './types.js';

export const options: IGenOptions = {
    path: [],
    output: './types',
    target: ['.proto'],
    ignore: ['node_modules', 'dist'],
    template: 'templates/nestjs-grpc.hbs',
    keepCase: false,
    comments: true,
    verbose: true
};
