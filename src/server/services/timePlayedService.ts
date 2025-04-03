import { Service, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { PlayerDataService } from "./playerDataService";
import { interval } from "shared/interval";

const cashInterval = interval(5);

@Service({})
export class TimePlayedService implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		while (true) {
			task.wait(1);

			for (const player of Players.GetPlayers()) {
				let cashAdded = 1;

				const character = player.Character;
				if (character) {
					if (character.GetAttribute("InSwordfightingZone") === true) {
						cashAdded *= 5;
						const newTime = ((character.GetAttribute("Time") as number | undefined) ?? 0) + 1;
						character.SetAttribute("Time", newTime);

						this.playerDataService.getProfileLoaded(player).then((profile) => {
							if (newTime > profile.Data.highestTimeAlive) {
								profile.Data.highestTimeAlive = newTime;
							}
							this.playerDataService.setProfile(player, profile);
						});
					}
				}

				if (cashInterval(player.UserId)) {
					this.playerDataService.getProfileLoaded(player).then((profile) => {
						profile.Data.cash += cashAdded;
						this.playerDataService.setProfile(player, profile);
					});
				}
			}
		}
	}
}
