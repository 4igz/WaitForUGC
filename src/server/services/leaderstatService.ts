import { Service, OnStart } from "@flamework/core";
import { LoadedProfile, PlayerDataService } from "./playerDataService";

@Service({})
export class LeaderstatService implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		this.playerDataService.profileLoaded.Connect((player: Player) => {
			const playerData = this.playerDataService.getProfileLoaded(player).expect();
			const leaderstats = new Instance("Folder");
			leaderstats.Name = "leaderstats";
			leaderstats.Parent = player;

			const timePlayed = new Instance("IntValue");
			timePlayed.Name = "Time";
			timePlayed.Value = playerData.Data.time;
			timePlayed.Parent = leaderstats;

			const timeSubtracted = new Instance("IntValue");
			timeSubtracted.Name = "Subtracted";
			timeSubtracted.Value = playerData.Data.subtractedTime;
			timeSubtracted.Parent = leaderstats;
		});

		this.playerDataService.profileSet.Connect((player: Player, newProfile: LoadedProfile) => {
			const leaderstats = player.FindFirstChild("leaderstats");
			if (leaderstats) {
				const timePlayed = leaderstats.FindFirstChild("Time") as IntValue;
				timePlayed.Value = newProfile.Data.time;

				const timeSubtracted = leaderstats.FindFirstChild("Subtracted") as IntValue;
				timeSubtracted.Value = newProfile.Data.subtractedTime;
			}
		});
	}
}
