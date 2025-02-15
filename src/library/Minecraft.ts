import { world, system, Player } from "@minecraft/server";
import { contentLog } from "./utils/index.js";

// eslint-disable-next-line prefer-const
let _server: ServerBuild;

export * from "./utils/index.js";

import { Player as PlayerBuilder } from "./classes/playerBuilder.js";
import { Command } from "./classes/commandBuilder.js";
import { ServerBuilder } from "./classes/serverBuilder.js";
import { UIForms } from "./classes/uiFormBuilder.js";
import { Block } from "./classes/blockBuilder.js";

export { CustomArgType, CommandPosition } from "./classes/commandBuilder.js";
export { commandSyntaxError, registerInformation as CommandInfo } from "./@types/classes/CommandBuilder";
export { Databases } from "./classes/databaseBuilder.js";
export { configuration } from "./configurations.js";

class ServerBuild extends ServerBuilder {
    public block = Block;
    public player = PlayerBuilder;
    public command = Command;
    public uiForms = UIForms;

    constructor() {
        super();
        this._buildEvent();
    }
    /**
     * @private
     */
    private _buildEvent() {
        const beforeEvents = world.beforeEvents;
        const afterEvents = world.afterEvents;
        const systemAfterEvents = system.afterEvents;

        systemAfterEvents.scriptEventReceive.subscribe((data) => {
            // Ensure this is run from a player.
            if (!data.sourceEntity) return;
            if (!(data.sourceEntity instanceof Player)) return;

            /**
             * Emit to 'scriptEvent' event listener
             */
            this.emit("scriptEvent", data);
            /**
             * This is for the command builder and an emitter.
             */
            const msg = data.id;
            if (!msg.startsWith(this.command.prefix)) return;

            const command = msg.slice(this.command.prefix.length);

            this.command.callCommand(data.sourceEntity, command, data.message.trim());
        });

        /**
         * Emit to 'beforeExplosion' event listener
         */
        beforeEvents.explosion.subscribe((data) => this.emit("beforeExplosion", data));
        /**
         * Emit to 'beforeExplosion' event listener
         */
        beforeEvents.explosion.subscribe((data) => this.emit("explosion", data));
        /**
         * Emit to 'pistonActivate' event listener
         */
        afterEvents.pistonActivate.subscribe((data) => this.emit("pistonActivate", data));
        /**
         * Emit to 'itemUse' event listener
         */
        beforeEvents.itemUse.subscribe((data) => this.emit("itemUseBefore", data));

        /**
         * Emit to 'itemUseBeforeOm' event listener
         */
        beforeEvents.itemUseOn.subscribe((data) => this.emit("itemUseOnBefore", data));
        /**
         * Emit to 'entityEffected' event listener
         */
        afterEvents.effectAdd.subscribe((data) => this.emit("entityEffected", data));
        /**
         * Emit to 'weatherChange' event listener
         */
        afterEvents.weatherChange.subscribe((data) => this.emit("weatherChange", data));
        /**
         * Emit to 'entityCreate' event listener
         */
        afterEvents.entitySpawn.subscribe((data) => this.emit("entityCreate", data));
        /**
         * Emit to 'blockBreak' event listener
         */
        beforeEvents.playerBreakBlock.subscribe((data) => this.emit("blockBreak", data));
        /**
         * Emit to 'blockHit' event listener
         */
        afterEvents.entityHitBlock.subscribe((data) => this.emit("blockHit", data));
        /**
         * Emit to 'worldInitialize' event listener
         */
        afterEvents.worldInitialize.subscribe((data) => this.emit("worldInitialize", data));
        /**
         * Emit to 'playerChangeDimension' event listener
         */
        afterEvents.playerDimensionChange.subscribe((data) => this.emit("playerChangeDimension", { player: data.player, dimension: data.player.dimension }));

        let worldLoaded = false;
        let tickCount = 0;
        let prevTime = Date.now();
        system.runInterval(() => {
            tickCount++;
            if (!worldLoaded && world.getAllPlayers().length) {
                /**
                 * Emit to 'ready' event listener
                 */
                try {
                    this.emit("ready", { loadTime: tickCount });
                } catch (e) {
                    contentLog.error(e);
                }
                worldLoaded = true;
            }

            this.emit("tick", {
                currentTick: tickCount,
                deltaTime: Date.now() - prevTime,
            });

            prevTime = Date.now();
        });

        /**
         * Emit to 'playerSpawn' event listener
         */
        afterEvents.playerSpawn.subscribe((data) => {
            if (data.initialSpawn) {
                this.emit("playerLoaded", data);
            }
        });
        /**
         * Emit to 'playerJoin' event listener
         */
        afterEvents.playerJoin.subscribe((data) => {
            this.emit("playerJoin", { playerName: data.playerName });
        });
        /**
         * Emit to 'playerLeave' event listener
         */
        afterEvents.playerLeave.subscribe((data) => {
            this.emit("playerLeave", data);
        });
    }
}

// eslint-disable-next-line prefer-const
_server = new ServerBuild();
export const Server = _server;
