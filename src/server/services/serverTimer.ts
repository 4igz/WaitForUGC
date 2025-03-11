import { Service, OnStart } from "@flamework/core";
import { CollectionService, Players } from "@rbxts/services";
import { interval } from "shared/interval";
import { PlayerDataService } from "./playerDataService";

const minute = 60;
const hour = minute * 60;
const day = hour * 24;
const year = day * 365;

const START_TIME = year;

const subtractionCooldown = interval(minute);

@Service({})
export class ServerTimer implements OnStart {
	public timeLeft: number = START_TIME;

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		CollectionService.GetTagged("TimeSubtractor").forEach((instance: Instance) => {
			if (!instance.IsA("BasePart")) {
				return;
			}

			const subtractAmount = instance.GetAttribute("SecondsToSubtract") as number | undefined;

			if (subtractAmount === undefined) {
				warn(`TimeSubtractor part ${instance.GetFullName()} is missing SecondsToSubtract attribute`);
				return;
			}

			instance.Touched.Connect((touchingPart) => {
				const player = Players.GetPlayerFromCharacter(touchingPart.Parent);
				if (player && subtractionCooldown(player.UserId)) {
					this.playerDataService.getProfileLoaded(player).then((profile) => {
						profile.Data.subtractedTime += subtractAmount;
						this.playerDataService.setProfile(player, profile);
						this.timeLeft -= subtractAmount;
						player.LoadCharacter();
					});
				}
			});
		});

		while (true) {
			task.wait(1);
			this.timeLeft -= 1;
		}
	}
}
