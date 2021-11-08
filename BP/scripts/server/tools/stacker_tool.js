import { Regions } from '../modules/regions.js';
import { getDirection } from '../modules/directions.js';
import { getPlayerDimension, printDebug, printerr } from '../util.js';
import { Tool } from './base_tool.js';
import { Tools } from './tool_manager.js';
class StackerTool extends Tool {
    constructor(range, mask) {
        super();
        this.tag = 'wedit:using_stacker';
        this.itemTool = 'wedit:stacker_wand';
        this.itemBase = 'minecraft:iron_axe';
        this.useOn = (player, session, loc) => {
            const [dimension, dimName] = getPlayerDimension(player);
            getDirection('back', player).then(dir => {
                const start = loc.offset(...dir);
                if (!this.mask.matchesBlock(start, dimName)) {
                    printDebug('stacked nothing');
                    return;
                }
                let end = loc;
                for (var i = 0; i < this.range; i++) {
                    end = end.offset(...dir);
                    if (!this.mask.matchesBlock(end.offset(...dir), dimName))
                        break;
                }
                const history = session.getHistory();
                history.record();
                history.addUndoStructure(start, end, 'any');
                Regions.save('temp_stack', loc, loc, player);
                for (const pos of start.blocksBetween(end)) {
                    Regions.load('temp_stack', pos, player, 'absolute');
                }
                Regions.delete('temp_stack', player);
                history.addRedoStructure(start, end, 'any');
                history.commit();
            }).catch(e => {
                printerr(e, player, true);
            });
        };
        this.range = range;
        this.mask = mask;
    }
}
Tools.register(StackerTool, 'stacker_wand');