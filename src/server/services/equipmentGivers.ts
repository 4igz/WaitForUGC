import { Service, OnStart } from "@flamework/core";
import { CollectionService, MarketplaceService, Players, ServerStorage } from "@rbxts/services";
import { PlayerDataService } from "./playerDataService";

@Service({})
export class EquipmentGivers implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		CollectionService.GetTagged("EquipmentGiver").forEach((equipmentGiver) => {
			if (!equipmentGiver.IsA("BasePart")) return;

			const equipment = equipmentGiver.GetAttribute("Equipment") as string;
			const cost = equipmentGiver.GetAttribute("Cost") as number;
			const productId = equipmentGiver.GetAttribute("Product") as number | undefined;

			const tool = ServerStorage.WaitForChild("Tools").WaitForChild(equipment);

			if (!tool) {
				warn(`Tool ${equipment} not found in ServerStorage`);
				return;
			}

			equipmentGiver.Touched.Connect((part) => {
				const character = part.Parent;
				if (!character) return;
				const player = Players.GetPlayerFromCharacter(character);
				if (!player) return;

				if (
					character?.FindFirstChild(equipment) ||
					player.FindFirstChild("Backpack")?.FindFirstChild(equipment)
				)
					return;
				this.playerDataService.getProfileLoaded(player).then((profile) => {
					if (productId !== undefined) {
						if (MarketplaceService.UserOwnsGamePassAsync(player.UserId, productId)) {
							tool.Clone().Parent = character;
						} else {
							MarketplaceService.PromptGamePassPurchase(player, productId);
							return;
						}
					}
					if (profile.Data.cash < cost) return;
					profile.Data.cash -= cost;
					this.playerDataService.setProfile(player, profile);
				});
			});
		});

		MarketplaceService.PromptGamePassPurchaseFinished.Connect((player, productId, purchased) => {
			if (!purchased) return;

			if (productId === 1099638383) {
				const character = player.Character;
				if (!character) return;
				const tool = ServerStorage.WaitForChild("Tools").WaitForChild("Gravity Coil");
				tool.Clone().Parent = character;
			}
		});
	}
}
