import { Service, OnInit } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";
import ProfileStore, { Profile } from "@rbxts/profile-store";
import { Players } from "@rbxts/services";

const profileTemplate = {
	time: 0,
	subtractedTime: 0,

	selfReports: 0,
	isExploiter: false,
	exploitReasons: [] as string[],
};

export type LoadedProfile = Profile<typeof profileTemplate>;

async function promisePlayerDisconnected(player: Player): Promise<void> {
	if (!player.IsDescendantOf(Players)) {
		return;
	}

	await Promise.fromEvent(Players.PlayerRemoving, (playerWhoLeft) => playerWhoLeft === player);
}

@Service({})
export class PlayerDataService implements OnInit {
	private store = ProfileStore.New(`PlayerData`, profileTemplate);
	private profiles = new Map<Player, Profile<typeof profileTemplate>>();
	public profileLoaded = new Signal<(player: Player) => void>();
	public profileSet = new Signal<(player: Player, newProfile: Profile<typeof profileTemplate>) => void>();

	onInit() {
		Players.PlayerAdded.Connect((player) => {
			const profile = this.store.StartSessionAsync(`${player.UserId}`, {
				Cancel: () => {
					return player.Parent !== Players;
				},
			});

			if (profile !== undefined) {
				profile.AddUserId(player.UserId);
				profile.Reconcile();

				profile.OnSessionEnd.Connect(() => {
					this.profiles.delete(player);
					player.Kick(`Profile session end - Please rejoin`);
				});

				if (player.Parent === Players) {
					this.profiles.set(player, profile);
					this.profileLoaded.Fire(player);
				} else {
					profile.EndSession();
				}
			} else {
				player.Kick(`Profile session start failed - Please rejoin`);
			}
		});

		Players.PlayerRemoving.Connect((player) => {
			const profile = this.profiles.get(player);
			if (profile) {
				profile.EndSession();
				this.profiles.delete(player);
			}
		});

		game.BindToClose(() => {
			for (const [, profile] of this.profiles) {
				profile.EndSession();
			}
		});
	}

	public async getProfileLoaded(player: Player): Promise<Profile<typeof profileTemplate>> {
		const existingProfile = this.profiles.get(player) as Profile<typeof profileTemplate> | undefined;
		if (existingProfile) {
			return existingProfile;
		}

		const promise = Promise.fromEvent(this.profileLoaded, (playerAdded: Player) => player === playerAdded);

		const disconnect = promisePlayerDisconnected(player).then(() => {
			promise.cancel();
		});

		const [success] = promise.await();
		if (!success) {
			throw `Player ${player.UserId} disconnected before profile was created`;
		}

		disconnect.cancel();

		return this.profiles.get(player) as Profile<typeof profileTemplate>;
	}

	public async setProfile(player: Player, newProfile: Profile<typeof profileTemplate>) {
		const existingProfile = this.profiles.get(player);
		if (!existingProfile) {
			return;
		}

		this.profiles.set(player, newProfile);
		this.profileSet.Fire(player, newProfile);
	}
}
