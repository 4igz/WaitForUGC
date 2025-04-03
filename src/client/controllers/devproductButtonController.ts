import { Controller, OnStart } from "@flamework/core";
import { CollectionService, Players } from "@rbxts/services";

@Controller({})
export class DevproductButtonController implements OnStart {
	onStart() {
		CollectionService.GetTagged("DevproductButton").forEach((button) => {
			if (!button.IsA("TextButton")) return;
			button.MouseButton1Click.Connect(() => {
				const productId = button.GetAttribute("ProductId") as number;
				game.GetService("MarketplaceService").PromptProductPurchase(Players.LocalPlayer, productId);
			});
		});

		CollectionService.GetInstanceAddedSignal("DevproductButton").Connect((button) => {
			if (!button.IsA("TextButton")) return;
			button.MouseButton1Click.Connect(() => {
				const productId = button.GetAttribute("ProductId") as number;
				game.GetService("MarketplaceService").PromptProductPurchase(Players.LocalPlayer, productId);
			});
		});
	}
}
