import { BlockLocation, BoolBlockProperty, IntBlockProperty, StringBlockProperty, World } from 'mojang-minecraft';
import { dimension } from '../../library/@types/index.js';
import { Server } from '../../library/Minecraft.js';
import { printDebug, printLocation } from '../util.js';
import { Token, Tokenizr } from './extern/tokenizr.js';
import { lexer, parseBlock, parsedBlock } from './parser.js';

// TODO: Implement 'not' and 'and' operations
export class Mask {
    private conditions: parsedBlock[] = [];

    matchesBlock(loc: BlockLocation, dimension: dimension) {
        if (this.conditions.length == 0) {
            return true;
        }

        const dim = World.getDimension(dimension);
        let passed = false;
        for (const filter of this.conditions) {
            if (filter.states) {
                const block = dim.getBlock(loc).permutation;
                if (block.type.id != filter.id) {
                    continue;
                }
                
                const properties = block.getAllProperties();
                let states_passed = 0;
                for (const state of filter.states) {
                    const prop = <IntBlockProperty | BoolBlockProperty | StringBlockProperty> properties.find(value => {
                        return value.name == state[0];
                    });
                    if (prop && `${prop.value}` == state[1]) {
                        states_passed++;
                    }
                }
                if (states_passed == filter.states.size) {
                    passed = true;
                    break;
                }
            } else {
                let command = `testforblock ${printLocation(loc, false)} ${filter.id}`;
                if (filter.data != -1) {
                    command += ' ' + filter.data;
                }
                if (!Server.runCommand(command, dimension).error) {
                    passed = true;
                    break;
                };
            }
        }
        
        return passed;
    };

    static parseArg(argument: string) {
        let conditions: parsedBlock[] = [];
        let block: parsedBlock = null;
        function pushBlock() {
            if (block == null) {
                throw lexer.error('expected block!');
            }
            conditions.push(block);
            block = null;
        }
        
        lexer.input(argument);
        let token: Token;
        while (token = lexer.token()) {
            switch (token.type) {
                case 'id':
                    block = parseBlock(lexer, token);
                case 'comma':
                    pushBlock();
                    break;
                case 'EOF':
                    pushBlock();
                    break;
                default:
                    throw lexer.error('unexpected token!');
            }
        }

        const mask = new Mask();
        mask.conditions = conditions;
        return mask;
    }
}