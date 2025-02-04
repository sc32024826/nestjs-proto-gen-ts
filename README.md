# Nest.js TypeScript generator from Protobuf
Generate TypeScript code from proto files.

[![Circle CI](https://circleci.com/gh/AlexDaSoul/nestjs-proto-gen-ts.svg?style=shield)](https://circleci.com/gh/AlexDaSoul/nestjs-proto-gen-ts/)
[![npm](https://img.shields.io/npm/dm/nestjs-proto-gen-ts)](https://www.npmjs.com/package/nestjs-proto-gen-ts)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](http://opensource.org/licenses/MIT)

This package uses the [protobufjs](https://protobufjs.github.io/protobuf.js/) library to auto-generate TypeScript or JavaScript code using [handlebars](https://handlebarsjs.com/) templates.

The package does not rely on the `protoc' compiler and generates TypeScript code directly, rather than outputting types from the generated JavaScript code. This makes it easy to use the automatically generated code because it does not need to be compiled at the time of creation.

原作者很久没更新,  由于数据库使用的蛇形命名, 但是生成的类型为小驼峰, 因此当我使用 prisma时 接口返回的数据 还需要加一步骤,  从蛇形命名转换为 小驼峰. 了解到这个库本身支持 保留命名方式, 只是原作者没有开启该选项, 升级了依赖版本 并添加 参数 -k, --keepCase

## Installation

```bash
$ npm install nest-proto2ts
```

## Example
Protobuf file hero-proto/hero.proto:
```proto
syntax = "proto3";

package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero) {}
}

message HeroById {
  int32 id = 1;
}

message Hero {
  int32 id = 1;
  string name = 2;
}
```

Generate interfaces:
```bash
$ pgt --path ./hero-proto
```

Output:
```typescript
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export namespace hero {
    export interface HeroesService {
        findOne(data: HeroById, metadata?: Metadata): Observable<Hero>;
    }
    export interface HeroById {
        id?: number;
    }
    export interface Hero {
        id?: number;
        name?: string;
    }
}
```

Controller:
```typescript
...
import { hero } from 'hero-proto/hero';

type HeroById = hero.HeroById;

@Controller()
export class HeroesController implements hero.HeroesService {
  @GrpcMethod('HeroesService', 'FindOne')
  findOne(data: HeroById, meta: Metadata): Observable<hero.Hero> {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Doe' },
    ];

    return items.find(({ id }) => id === data.id);
  }
}
```

Client:
```typescript
...
import { hero } from 'hero-proto/hero';

@Injectable()
export class AppService implements OnModuleInit {
  private heroesService: hero.HeroesService;

  constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.heroesService = this.client.getService<hero.HeroesService>('HeroesService');
  }

  getHero(): Observable<string> {
    return this.heroesService.findOne({ id: 1 });
  }
}
```

## Usage
Base usage:
```bash
$ pgt --path grpc-proto  // --path 测试发现, 后边只能用目录, 无法使用 proto/*  这种写法
```
Output dir:
```bash
$ pgt --path grpc-proto --output any-dir
```
Target files:
```bash
$ pgt --path grpc-proto --target one.proto two.proto
```
Ignore directories or files:
```bash
$ pgt --path grpc-proto --ignore grpc-proto/ignore-dir
```
Custom handlebar's template for output:
```bash
$ pgt --path grpc-proto --template custom-template.hbs
```
新增 KeepCase
```bash
$ pgt --path grpc-proto --output any-dir --keepCase
```
## Options

The following options are available:

```
  --version, -v   Show version number                                  [boolean]
  --help, -h      Show help                                            [boolean]
  --path, -p      Path to root directory                      [array] [required]
  --output, -o    Path to output directory                              [string]
  --template      Handlebar's template for output
                                 [string] [default: "templates/nestjs-grpc.hbs"]
  --target, -t    Proto files                      [array] [default: [".proto"]]
  --ignore, -i    Ignore file or directories
                                      [array] [default: ["node_modules","dist"]]
  --comments, -c  Add comments from proto              [boolean] [default: true]
  --verbose       Log all output to console            [boolean] [default: true]
```
