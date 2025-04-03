import { Controller, OnStart } from "@flamework/core";
import { createMotion } from "@rbxts/ripple";
import { CollectionService, MarketplaceService, Players } from "@rbxts/services";
import { Zone } from "@rbxts/zone-plus";
import { Events } from "client/network";
import { springs } from "client/utils/springs";

const characterSnapMotion = createMotion(new CFrame());
characterSnapMotion.start();

@Controller({})
export class ZoneController implements OnStart {
	onStart() {
		CollectionService.GetTagged("SnapZone").forEach((instance: Instance) => {
			if (!instance.IsA("PVInstance")) {
				return;
			}

			for (const child of instance.GetDescendants()) {
				if (child.IsA("BasePart")) {
					child.Transparency = 1;
				}
			}

			instance.DescendantAdded.Connect((child) => {
				if (child.IsA("BasePart")) {
					child.Transparency = 1;
				}
			});

			const zone = new Zone(instance);
			zone.localPlayerEntered.Connect(() => {
				const character = Players.LocalPlayer.Character;
				if (!character) return;
				const hrp = character.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
				if (!hrp) return;
				const humanoid = character.FindFirstChild("Humanoid") as Humanoid | undefined;
				if (!humanoid || humanoid.GetState() === Enum.HumanoidStateType.Dead) return;

				const toPart = instance.Parent?.FindFirstChild("To") as Part;
				if (!toPart) {
					warn(`SnapZone ${instance.GetFullName()} missing 'To' part`);
					return;
				}

				hrp.Anchored = true;
				characterSnapMotion.immediate(character.GetPivot());

				// Give them some time to think about their mistakes.
				task.wait(0.5);

				characterSnapMotion.spring(toPart.GetPivot(), springs.gentle);

				const unsub = characterSnapMotion.onComplete(() => {
					hrp.Anchored = false;
					unsub();
				});
			});
		});

		Events.returnPlayerToLobby.connect(() => {
			const character = Players.LocalPlayer.Character;
			if (!character) return;
			const hrp = character.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
			if (!hrp) return;

			const spawn = CollectionService.GetTagged("Spawn")[0] as Part;
			if (!spawn) {
				warn("No spawn found");
				return;
			}

			hrp.Anchored = true;
			characterSnapMotion.immediate(character.GetPivot());

			// Give them some time to think about their mistakes.
			task.wait(0.5);
			characterSnapMotion.spring(spawn.GetPivot(), springs.gentle);

			const unsub = characterSnapMotion.onComplete(() => {
				hrp.Anchored = false;
				unsub();
			});
		});

		CollectionService.GetTagged("TeleportButton").forEach((instance: Instance) => {
			if (!instance.IsA("TextButton")) {
				return;
			}
			this.setupTeleportButton(instance);
		});

		CollectionService.GetInstanceAddedSignal("TeleportButton").Connect((instance) => {
			if (!instance.IsA("TextButton")) {
				return;
			}
			this.setupTeleportButton(instance);
		});

		let unsub: () => void | undefined;

		const setupCharacter = (character: Model) => {
			if (unsub !== undefined) {
				unsub();
			}

			unsub = characterSnapMotion.onStep((value) => {
				character.PivotTo(value);
			});
		};

		if (Players.LocalPlayer.Character) {
			setupCharacter(Players.LocalPlayer.Character!);
		}

		Players.LocalPlayer.CharacterAdded.Connect(setupCharacter);
	}

	setupTeleportButton(instance: TextButton) {
		instance.MouseButton1Click.Connect(() => {
			MarketplaceService.PromptProductPurchase(Players.LocalPlayer, 3237610286);
		});
	}
}
