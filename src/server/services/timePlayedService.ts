import { Service, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { PlayerDataService } from "./playerDataService";

@Service({})
export class TimePlayedService implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		while (true) {
			task.wait(1);
			for (const player of Players.GetPlayers()) {
				this.playerDataService.getProfileLoaded(player).then((profile) => {
					profile.Data.time += 1;
					this.playerDataService.setProfile(player, profile);
				});
			}
		}
	}
}
