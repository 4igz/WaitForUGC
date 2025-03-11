//!optimize 2
import Signal from "@rbxts/lemon-signal";

interface DeveloperProduct {
	id: number;
	name: string;
	cashReward?: number;
	grantReward: (player: Player) => void;
}

const minute = 60;
const hour = 60 * minute;
const day = 24 * hour;
const month = 30 * day;

export const subtractTime = new Signal<(amount: number) => void>();

export const developerProducts: DeveloperProduct[] = [
	{
		id: 0,
		name: "Subtract 24 hours",
		grantReward: () => {
			subtractTime.Fire(day);
		},
	},
	{
		id: 0,
		name: "Subtract 7 days",
		grantReward: () => {
			subtractTime.Fire(day * 7);
		},
	},
	{
		id: 0,
		name: "Subtract 1 month",
		grantReward: () => {
			subtractTime.Fire(month);
		},
	},
	{
		id: 0,
		name: "Subtract 6 months",
		grantReward: () => {
			subtractTime.Fire(month * 6);
		},
	},
];

export function getDevProduct(productId: number): DeveloperProduct | undefined {
	const product = developerProducts.find((dp) => dp.id === productId);
	return product;
}

export function handlePurchase(player: Player, productId: number): Enum.ProductPurchaseDecision {
	const product = getDevProduct(productId);
	if (product) {
		product.grantReward(player);
		return Enum.ProductPurchaseDecision.PurchaseGranted;
	}
	return Enum.ProductPurchaseDecision.NotProcessedYet;
}
