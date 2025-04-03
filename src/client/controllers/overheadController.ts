import { Controller, OnStart } from "@flamework/core";
import { Players, ReplicatedStorage } from "@rbxts/services";

@Controller({})
export class OverheadController implements OnStart {
	onStart() {
		for (const player of Players.GetPlayers()) {
			this.setupBillboard(player);

			player.CharacterAdded.Connect((character) => {
				this.setupBillboard(player);
			});
		}

		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				this.setupBillboard(player);
			});
		});
	}

	setupBillboard(player: Player) {
		const character = player.Character ?? player.CharacterAdded.Wait()[0];
		const playerTime = (player.GetAttribute("Time") as number | undefined) ?? 0;
		const playerKills = (player.GetAttribute("Kills") as number | undefined) ?? 0;

		const overheadBillboard = ReplicatedStorage.WaitForChild("Overhead").Clone() as BillboardGui;

		const timeLabel = overheadBillboard.WaitForChild("Time") as TextLabel;
		timeLabel.Text = `⏰ ${playerTime}`;

		const killsLabel = overheadBillboard.WaitForChild("Killstreak") as TextLabel;
		killsLabel.Text = `☠️ ${playerKills}`;
		overheadBillboard.Enabled = player.GetAttribute("InSwordfightingZone") === true;
		overheadBillboard.Parent = character.WaitForChild("Head");

		// Listen to changed events
		character.AttributeChanged.Connect((attributeName) => {
			if (attributeName === "Time") {
				timeLabel.Text = `⏰ ${character.GetAttribute("Time") ?? 0}`;
			} else if (attributeName === "Kills") {
				killsLabel.Text = `☠️ ${character.GetAttribute("Kills") ?? 0}`;
			} else if (attributeName === "InSwordfightingZone") {
				overheadBillboard.Enabled = character.GetAttribute("InSwordfightingZone") === true;
			}
		});
	}
}
