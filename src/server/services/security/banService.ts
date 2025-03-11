import { Service } from "@flamework/core";
import { Players, RunService } from "@rbxts/services";

@Service({})
export class BanService {
	async banPlayer(player: Player, reason: string, duration: number = -1) {
		if (RunService.IsStudio()) {
			warn("Ban attempt in studio, not actually banning.");
			return Promise.resolve();
		}
		Players.BanAsync({
			DisplayReason: "You have been banned from the game.",
			UserIds: [player.UserId],
			PrivateReason: reason,
			Duration: duration,
		});
	}
}
