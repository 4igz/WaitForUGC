import { Service, OnStart } from "@flamework/core";
import { CollectionService, ServerStorage } from "@rbxts/services";
import { Zone } from "@rbxts/zone-plus";
import { ServerTimer } from "./serverTimer";
import { PlayerDataService } from "./playerDataService";

@Service({})
export class ZoneService implements OnStart {
	private connectedHumanoids = new Map<Humanoid, RBXScriptConnection>();

	constructor(private readonly serverTimer: ServerTimer, private readonly playerDataService: PlayerDataService) {}

	onStart() {
		CollectionService.GetTagged("SwordfightZone").forEach((instance: Instance) => {
			if (!instance.IsA("PVInstance")) {
				return;
			}
			const zone = new Zone(instance);
			zone.playerEntered.Connect((player) => this.swordGiverEnter(player, instance));
			zone.playerExited.Connect((player) => this.swordGiverExit(player));
		});

		CollectionService.GetTagged("SubtractTimeZone").forEach((instance: Instance) => {
			if (!instance.IsA("PVInstance")) {
				return;
			}
			const zone = new Zone(instance);
			// zone.playerEntered.Connect(() => this.subtractTimeEnter());
			// zone.playerExited.Connect(() => this.subtractTimeExit());

			const SUBTRACTION_AMOUNT = 120;

			task.spawn(() => {
				while (true) {
					task.wait(1);
					for (const player of zone.getPlayers()) {
						this.serverTimer.timeLeft -= SUBTRACTION_AMOUNT;

						this.playerDataService.getProfileLoaded(player).then((profile) => {
							profile.Data.subtractedTime += SUBTRACTION_AMOUNT;
							this.playerDataService.setProfile(player, profile);
						});
					}
				}
			});
		});
	}

	swordGiverEnter(player: Player, zoneContainer: PVInstance) {
		const character = player.Character;
		if (!character) return;

		const sword = ServerStorage.WaitForChild("Tools").WaitForChild("ClassicSword").Clone();
		sword.Parent = character;

		const humanoid = character.WaitForChild("Humanoid") as Humanoid;

		this.connectedHumanoids.set(
			humanoid,
			humanoid.Died.Connect(() => {
				player.LoadCharacter();

				const toPart = zoneContainer.FindFirstChild("To") as Part;
				if (toPart) {
					const character = player.Character ?? player.CharacterAdded.Wait()[0];
					character.PivotTo(toPart.CFrame);
				}
			}),
		);
	}

	swordGiverExit(player: Player) {
		const character = player.Character;
		if (!character) return;
		const humanoid = character.WaitForChild("Humanoid") as Humanoid;
		humanoid.UnequipTools();

		const backpack = player.WaitForChild("Backpack");
		for (const tool of backpack.GetChildren()) {
			if (tool.IsA("Tool") && tool.Name === "ClassicSword") {
				tool.Destroy();
			}
		}

		const connection = this.connectedHumanoids.get(humanoid);
		if (connection) {
			connection.Disconnect();
			this.connectedHumanoids.delete(humanoid);
		}
	}
}
