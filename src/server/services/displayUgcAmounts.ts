import { Service, OnStart } from "@flamework/core";
import { CollectionService, MarketplaceService } from "@rbxts/services";

@Service({})
export class DisplayUgcAmounts implements OnStart {
	onStart() {
		CollectionService.GetTagged("UGC").forEach((instance) => {
			const bg = instance.FindFirstChild("BG") as BillboardGui;
			if (!bg) {
				warn("No BillboardGui found in UGC model");
				return;
			}
			const assetId = instance.GetAttribute("assetId") as number;
			if (assetId === undefined) {
				warn("No assetId found in UGC model");
				return;
			}
			const info = MarketplaceService.GetProductInfo(assetId);
			if (!info) {
				warn("No product info found for assetId", assetId, Enum.InfoType.Asset);
				return;
			}
			const txt = bg.FindFirstChild("Txt") as TextLabel;
			if (!txt) {
				warn("No TextLabel found in BillboardGui");
				return;
			}
			const remaining = (info as unknown as { Remaining: number }).Remaining;
			const totalQuantity = (info as unknown as { CollectiblesItemDetails: { TotalQuantity: number } })
				.CollectiblesItemDetails.TotalQuantity;
			txt.Text = `${remaining}/${totalQuantity}`;
		});
	}
}
