import * as BabelParser from '@babel/parser';
import * as BabelTypes from '@babel/types';
import Traverse from '@babel/traverse';

export default class Parser {
    private nodeCache: BabelTypes.Node | null;

    constructor() {
        this.nodeCache = null;
    }

    parse(input: string, options?: BabelParser.ParserOptions): Parser {
        try {
            this.nodeCache = BabelParser.parse(input, options);
            console.log(this.nodeCache);
        } catch (error) {
            console.log(error);
        }
        return this;
    }

    parseAndGet(input: string, options?: BabelParser.ParserOptions): BabelTypes.Node {
        this.nodeCache = BabelParser.parse(input, options);
        return this.nodeCache!!;
    }

    filter(type: BabelTypes.Node['type']): BabelTypes.Node[] {
        const nodes: BabelTypes.Node[] = [];
        Traverse(this.nodeCache, {
            enter(path) {
                if (BabelTypes.is(type, path.node)) {
                    nodes.push(path.node);
                }
            },
        });
        return nodes;
    }
}
