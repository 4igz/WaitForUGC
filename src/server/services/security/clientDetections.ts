import { Service, OnStart } from "@flamework/core";
import { Events } from "server/network";
import { Players } from "@rbxts/services";
import { PlayerDataService } from "../playerDataService";

@Service({})
export class ClientDetections implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		// Player will self-report if they hit any of our detections, or if they just fire the remote themselves.
		Events.selfReport.connect((player, reportType: string) => {
			const profile = this.playerDataService.getProfileLoaded(player).expect();
			profile.Data.selfReports++;
			profile.Data.isExploiter = true;
			profile.Data.exploitReasons.push(reportType);

			this.playerDataService.setProfile(player, profile);

			warn(`${player.Name} self-reported for ${reportType}`);
		});

		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				const humanoid = character.WaitForChild("Humanoid") as Humanoid;

				let lastRecordedPosition = character.GetPivot();
				let alive = true;
				humanoid.Died.Connect(() => {
					alive = false;
				});

				task.spawn(() => {
					while (alive) {
						task.wait(1);
						lastRecordedPosition = character.GetPivot();
					}
				});

				// This isn't a very accurate detection, hence why we only target known exploiters.
				const ALLOWABLE_SPEED = 30;

				humanoid.Running.Connect((speed) => {
					if (speed > ALLOWABLE_SPEED) {
						this.playerDataService.getProfileLoaded(player).then((profile) => {
							character.PivotTo(lastRecordedPosition);
						});
					}
				});

				humanoid.Swimming.Connect((speed) => {
					if (speed > ALLOWABLE_SPEED) {
						this.playerDataService.getProfileLoaded(player).then((profile) => {
							character.PivotTo(lastRecordedPosition);
						});
					}
				});
			});
		});
	}
}
