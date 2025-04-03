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
	}
}
