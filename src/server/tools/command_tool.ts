import { Player } from "@minecraft/server";
import { Server } from "@notbeer-api";
import { PlayerSession } from "server/sessions";
import { Tool } from "./base_tool";
import { Tools } from "./tool_manager";
import { printerr } from "server/util";

class CommandTool extends Tool {
    public command: string;
    public isCustom = false;

    use = function (self: CommandTool, player: Player, session: PlayerSession) {
        if (self.isCustom) {
            let firstSpace = self.command.indexOf(" ");
            if (firstSpace == -1) {
                firstSpace = self.command.length;
            }
            const usingItem = session.usingItem;
            session.usingItem = false;
            Server.command.callCommand(player, self.command.substring(0, firstSpace).trim(), self.command.substring(firstSpace).trim());
            session.usingItem = usingItem;
        } else {
            Server.queueCommand(self.command, player).then(({ error }) => {
                if (error) {
                    printerr("worldedit.tool.noPerm", player, true);
                }
            });
        }
    };

    constructor(command: string) {
        super();
        if (command.startsWith(";")) {
            this.isCustom = true;
            this.command = command.slice(1);
        } else if (command.startsWith("/")) {
            this.isCustom = false;
            this.command = command.slice(1);
        } else {
            this.command = command;
        }
    }

    toJSON() {
        return {
            toolType: this.type,
            command: (this.isCustom ? ";" : "/") + this.command,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static parseJSON(json: { [key: string]: any }) {
        return [json.command];
    }
}
Tools.register(CommandTool, "command_wand");
