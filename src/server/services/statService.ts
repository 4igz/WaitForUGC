import { Service, OnStart } from "@flamework/core";
import { LoadedProfile, PlayerDataService } from "./playerDataService";
import { Debris, Players, ServerStorage, Workspace } from "@rbxts/services";

const KILL_HEAL_AMOUNT = 50;
const KILL_CASH_ADDED = 100;

const killVfx = ServerStorage.WaitForChild("KillVfx").WaitForChild("DeathParticle") as Attachment;

@Service({})
export class LeaderstatService implements OnStart {
	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		// Handle player kills
		Players.PlayerAdded.Connect((player) => {
			player.CharacterAdded.Connect((character) => {
				const humanoid = character.WaitForChild("Humanoid") as Humanoid;
				humanoid.Died.Connect(() => {
					const tag = humanoid.FindFirstChild("creator") as ObjectValue;
					if (tag) {
						const creator = tag.Value as Player;

						const creatorCharacter = creator.Character;
						if (creatorCharacter) {
							const creatorHumanoid = creatorCharacter.FindFirstChild("Humanoid") as Humanoid;
							if (creatorHumanoid) {
								creatorHumanoid.Health += KILL_HEAL_AMOUNT;
							}
							const newKills = ((creatorCharacter.GetAttribute("Kills") as number | undefined) ?? 0) + 1;
							creatorCharacter.SetAttribute("Kills", newKills);

							this.playerDataService.getProfileLoaded(creator).then((profile) => {
								if (newKills > profile.Data.highestKillstreak) {
									profile.Data.highestKillstreak = newKills;
								}

								this.playerDataService.setProfile(creator, profile);
							});
						}

						const vfx = killVfx.Clone() as Attachment;
						const particleEmitter = vfx.WaitForChild("ParticleEmitter") as ParticleEmitter;
						vfx.WorldPosition = character.GetPivot().Position.sub(new Vector3(0, 2.5, 0));
						vfx.Parent = Workspace.Terrain;
						task.defer(() => {
							particleEmitter.Emit(particleEmitter.GetAttribute("EmitCount") as number);
							Debris.AddItem(vfx, particleEmitter.Lifetime.Max);
						});

						this.playerDataService.getProfileLoaded(creator).then((profile) => {
							profile.Data.cash += KILL_CASH_ADDED;
							profile.Data.kills++;

							this.playerDataService.setProfile(creator, profile);
						});
					}
				});
			});
		});

		this.playerDataService.profileLoaded.Connect((player: Player) => {
			const playerData = this.playerDataService.getProfileLoaded(player).expect();
			const leaderstats = new Instance("Folder");
			leaderstats.Name = "leaderstats";
			leaderstats.Parent = player;

			const timePlayed = new Instance("IntValue");
			timePlayed.Name = "Cash";
			timePlayed.Value = playerData.Data.cash;
			timePlayed.Parent = leaderstats;

			const timeSubtracted = new Instance("IntValue");
			timeSubtracted.Name = "Subtracted";
			timeSubtracted.Value = playerData.Data.subtractedTime;
			timeSubtracted.Parent = leaderstats;
		});

		this.playerDataService.profileSet.Connect((player: Player, newProfile: LoadedProfile) => {
			const leaderstats = player.FindFirstChild("leaderstats");
			if (leaderstats) {
				const cash = leaderstats.FindFirstChild("Cash") as IntValue;
				cash.Value = newProfile.Data.cash;

				const timeSubtracted = leaderstats.FindFirstChild("Subtracted") as IntValue;
				timeSubtracted.Value = newProfile.Data.subtractedTime;
			}
		});
	}
}
