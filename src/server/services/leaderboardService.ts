import { Players, CollectionService, DataStoreService } from "@rbxts/services";
import { Service, OnStart } from "@flamework/core";
import { PlayerDataService } from "./playerDataService";
import Object from "@rbxts/object-utils";

interface LeaderboardEntry {
	playerName: string;
	score: number;
	userId: number;
}

@Service()
export class LeaderboardService implements OnStart {
	private readonly LB_DISPLAY_NUM = 25;

	constructor(private playerDataService: PlayerDataService) {}

	public onStart(): void {
		const taggedLeaderboards = CollectionService.GetTagged("Leaderboard");

		for (const leaderboard of taggedLeaderboards) {
			const trackedStat = leaderboard.GetAttribute("TrackingStat") as string;
			const playerTemplate = leaderboard.WaitForChild("PlayerFrame") as Frame;
			playerTemplate.LayoutOrder = -1;
			const score = playerTemplate.WaitForChild("Wins") as TextLabel;

			score.Text = "#";

			task.spawn(() => {
				const dataStore = DataStoreService.GetOrderedDataStore(`${os.date("*t").month}${trackedStat}`);
				const activeEntries: Array<Frame> = [];

				const updateLeaderboard = () => {
					for (const player of Players.GetPlayers()) {
						if (player.UserId < 1) {
							continue;
						}
						task.spawn(() => {
							const [success, err] = pcall(() => {
								const profile = this.playerDataService.getProfileLoaded(player).expect();
								const data = profile.Data as unknown as Record<string, number>;

								dataStore.UpdateAsync(tostring(player.UserId), () => {
									if (data[trackedStat] === undefined) {
										throw `${trackedStat} does not exist in our profiles!`;
									}
									return math.floor(data[trackedStat]);
								});
							});

							if (!success) {
								warn(err);
							}
						});
					}

					const minValue = 1;
					const maxValue = 10e69;
					const pages = dataStore.GetSortedAsync(false, this.LB_DISPLAY_NUM, minValue, maxValue);
					const top = pages.GetCurrentPage();
					const list: LeaderboardEntry[] = [];

					for (const entry of top) {
						const userId = tonumber(entry.key) as number;
						const stat = entry.value as number;
						let username = "[Failed To Load]";

						const [success, err] = pcall(() => {
							username = Players.GetNameFromUserIdAsync(userId);
						});

						if (!success) {
							warn(`Error getting name for ${userId}. Error: ${err}`);
						}

						list.push({ playerName: username, score: stat, userId: userId });
					}

					activeEntries.forEach((entry) => {
						entry.Destroy();
					});

					for (const [i, listEntry] of Object.entries(list)) {
						const playerFrame = playerTemplate.Clone();
						const place = playerFrame.WaitForChild("Place") as TextLabel;
						const name = playerFrame.WaitForChild("PlayerName") as TextLabel;
						const score = playerFrame.WaitForChild("Wins") as TextLabel;
						playerFrame.LayoutOrder = i;

						place.Text = tostring(list.indexOf(listEntry) + 1);
						name.Text = listEntry.playerName;
						score.Text = tostring(listEntry.score);
						playerFrame.Parent = leaderboard;
						activeEntries.push(playerFrame);
					}
				};

				// Start periodic updates
				task.spawn(() => {
					while (true) {
						updateLeaderboard();
						task.wait(360);
					}
				});
			});
		}
	}
}
