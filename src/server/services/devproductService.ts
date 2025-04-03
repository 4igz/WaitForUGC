import { Service, OnStart } from "@flamework/core";
import { ServerTimer } from "./serverTimer";
import { PlayerDataService } from "./playerDataService";
import {
	CollectionService,
	Debris,
	Lighting,
	MarketplaceService,
	Players,
	ReplicatedStorage,
	TextChatService,
	TweenService,
	Workspace,
} from "@rbxts/services";
import Object from "@rbxts/object-utils";
import { Events } from "server/network";

const TrollDevproducts = {
	Kill: 3237539576,
	Trip: 3237538908,
	Freeze: 3237539459,
	Fling: 3237539213,
};

// Function to make announcements using TextChatService in Roblox TypeScript

/**
 * Makes an announcement to all players using TextChatService
 * @param message The message to announce
 * @param color Optional color for the announcement (RGB values from 0-255)
 * @param prefix Optional prefix to add before the message
 */
function makeAnnouncement(message: string, prefix: string = "ANNOUNCEMENT"): void {
	Events.announcement.broadcast(message, prefix);
}

// Usage example:
// makeAnnouncement("The game will restart in 5 minutes!");
// makeAnnouncement("Double XP weekend has started!", [0, 255, 0], "EVENT");

@Service({})
export class DevproductService implements OnStart {
	private productFunctions: Record<number, (player: Player, target: Player) => boolean> = {
		[3237610286]: (purchaser: Player) => {
			const teleportAllBrick = CollectionService.GetTagged("AllTeleportLocation")[0] as BasePart;
			if (!teleportAllBrick) {
				warn("Missing teleport all brick.");
				return false;
			}
			for (const player of Players.GetPlayers()) {
				if (player === purchaser) continue;
				const character = player.Character;
				if (!character) continue;
				character.PivotTo(teleportAllBrick.GetPivot());
			}
			makeAnnouncement(`${purchaser.Name} teleported everyone!`, "[SERVER]");
			return true;
		},

		[3237619593]: (_purchaser: Player) => {
			makeAnnouncement(
				'<font color="rgb(255, 0, 0)">A nuclear bomb has been launched! Seek shelter immediately!</font>',
				"NUCLEAR ALERT",
			);
			this.beginNukeSequence();
			return true;
		},

		[3237617930]: (purchaser: Player) => {
			// Fling Others
			makeAnnouncement('<font color="rgb(255, 0, 0)">Somebody flung everybody!</font>', "FLING ALERT");
			for (const player of Players.GetPlayers()) {
				if (player === purchaser) continue;
				const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as Part;
				const humanoid = player.Character?.FindFirstChild("Humanoid") as Humanoid;

				if (humanoid && hrp) {
					hrp.SetNetworkOwner(undefined);
					humanoid.ChangeState(Enum.HumanoidStateType.Ragdoll);
					const fling = math.clamp(math.random(-1000, 1000), -500, 500);
					hrp.AssemblyAngularVelocity = new Vector3(fling, math.abs(fling), fling);
					hrp.AssemblyLinearVelocity = new Vector3(fling, math.abs(fling), fling);

					task.delay(2, () => {
						hrp.SetNetworkOwner(player);
					});
				}
			}
			return true;
		},

		[3237669456]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(255, 0, 0)">${purchaser.Name} added 7 days to the timer!</font>`,
				"TIME ADDED",
			);
			this.serverTimer.timeLeft += this.serverTimer.day * 7;
			return true;
		}, //+1 week
		[3237669610]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(255, 0, 0)">${purchaser.Name} added 1 month to the timer!</font>`,
				"TIME ADDED",
			);
			this.serverTimer.timeLeft += this.serverTimer.month;
			return true;
		}, //+1 month
		[3237669682]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(255, 0, 0)">${purchaser.Name} added 4 months to the timer!</font>`,
				"TIME ADDED",
			);
			this.serverTimer.timeLeft += this.serverTimer.month * 4;
			return true;
		}, //+4 months
		[3237064475]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(255, 0, 0)">${purchaser.Name} added 1 year to the timer!</font>`,
				"TIME ADDED",
			);
			this.serverTimer.timeLeft += this.serverTimer.year;
			return true;
		}, //+1 year

		[3237668678]: (purchaser: Player) => {
			const profile = this.playerDataService.getProfileLoaded(purchaser).expect();
			makeAnnouncement(
				`<font color="rgb(0, 255, 0)">${purchaser.Name} subtracted 7 days from the timer!</font>`,
				"TIME SUBTRACTED",
			);
			this.serverTimer.timeLeft -= this.serverTimer.day * 7;
			profile.Data.subtractedTime += this.serverTimer.day * 7;
			this.playerDataService.setProfile(purchaser, profile);
			return true;
		}, //-1 week
		[3237668812]: (purchaser: Player) => {
			const profile = this.playerDataService.getProfileLoaded(purchaser).expect();
			makeAnnouncement(
				`<font color="rgb(0, 255, 0)">${purchaser.Name} subtracted 1 month from the timer!</font>`,
				"TIME SUBTRACTED",
			);
			this.serverTimer.timeLeft -= this.serverTimer.month;
			profile.Data.subtractedTime += this.serverTimer.month;
			this.playerDataService.setProfile(purchaser, profile);
			return true;
		}, //-1 month
		[3237669312]: (purchaser: Player) => {
			const profile = this.playerDataService.getProfileLoaded(purchaser).expect();
			makeAnnouncement(
				`<font color="rgb(0, 255, 0)">${purchaser.Name} subtracted 4 MONTHS from the timer!</font>`,
				"TIME SUBTRACTED",
			);
			this.serverTimer.timeLeft -= this.serverTimer.month * 4;
			profile.Data.subtractedTime += this.serverTimer.month * 4;
			this.playerDataService.setProfile(purchaser, profile);
			return true;
		}, //-4 months
		[3237063355]: (purchaser: Player) => {
			// Subtract 1 Year
			const profile = this.playerDataService.getProfileLoaded(purchaser).expect();
			makeAnnouncement(
				`<font color="rgb(0, 255, 0)">${purchaser.Name} subtracted 1 YEAR from the timer!</font>`,
				"TIME SUBTRACTED",
			);
			this.serverTimer.timeLeft -= this.serverTimer.year;
			profile.Data.subtractedTime += this.serverTimer.year;
			this.playerDataService.setProfile(purchaser, profile);
			return true;
		},

		[3237672883]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(0, 255, 50)">${purchaser.Name} gave everybody 10,000 Cash!</font>`,
				"CASH DROP",
			);
			for (const player of Players.GetPlayers()) {
				this.playerDataService.getProfileLoaded(player).then((profile) => {
					profile.Data.cash += 10_000;
					this.playerDataService.setProfile(player, profile);
				});
			}
			return true;
		}, // Give all 10k cash

		[3237672966]: (purchaser: Player) => {
			makeAnnouncement(
				`<font color="rgb(0, 255, 50)">${purchaser.Name} gave everybody 100,000 Cash!</font>`,
				"CASH DROP",
			);
			for (const player of Players.GetPlayers()) {
				this.playerDataService.getProfileLoaded(player).then((profile) => {
					profile.Data.cash += 100_000;
					this.playerDataService.setProfile(player, profile);
				});
			}
			return true;
		}, // Give all 100k cash

		// Trolls
		[TrollDevproducts.Kill]: (player: Player, target: Player) => {
			const character = target.Character;

			if (!character) return false;

			const humanoid = target.Character?.FindFirstChild("Humanoid") as Humanoid;
			if (humanoid) {
				humanoid.RootPart?.SetNetworkOwner(undefined);
				humanoid.TakeDamage(humanoid.MaxHealth);
				const explosion = new Instance("Explosion");
				explosion.Position = character.GetPivot().Position;
				explosion.DestroyJointRadiusPercent = 0;
				explosion.BlastPressure = 0;
				explosion.BlastRadius = 10;
				explosion.Parent = Workspace.Terrain;

				for (const bodyPart of character.GetChildren()) {
					if (bodyPart.IsA("BasePart")) {
						const fling = math.clamp(math.random(-1000, 1000), -500, 500);
						bodyPart.AssemblyAngularVelocity = new Vector3(fling, math.abs(fling), fling);
						bodyPart.AssemblyLinearVelocity = new Vector3(fling, math.abs(fling), fling);
					}
				}

				Debris.AddItem(explosion, 1.5);
				Events.announcement.fire(target, `${player.Name} trolled you!`, "TROLL");
				return true;
			}
			return false;
		},

		[TrollDevproducts.Trip]: (player: Player, target: Player) => {
			const hrp = target.Character?.FindFirstChild("HumanoidRootPart") as Part;
			const humanoid = target.Character?.FindFirstChild("Humanoid") as Humanoid;

			if (humanoid && hrp) {
				hrp.SetNetworkOwner(undefined);
				humanoid.ChangeState(Enum.HumanoidStateType.Physics);
				hrp.AssemblyAngularVelocity = new Vector3(20, 20, 20);
				hrp.AssemblyLinearVelocity = new Vector3(10, 15, 10);
				Events.announcement.fire(target, `${player.Name} trolled you!`, "TROLL");

				task.delay(2, () => {
					hrp.SetNetworkOwner(target);
					humanoid.ChangeState(Enum.HumanoidStateType.Running);
				});
				return true;
			}
			return false;
		},

		[TrollDevproducts.Fling]: (player: Player, target: Player) => {
			const hrp = target.Character?.FindFirstChild("HumanoidRootPart") as Part;
			const humanoid = target.Character?.FindFirstChild("Humanoid") as Humanoid;

			if (humanoid && hrp) {
				hrp.SetNetworkOwner(undefined);
				humanoid.ChangeState(Enum.HumanoidStateType.Ragdoll);
				const fling = math.clamp(math.random(-1000, 1000), -500, 500);
				hrp.AssemblyAngularVelocity = new Vector3(fling, math.abs(fling), fling);
				hrp.AssemblyLinearVelocity = new Vector3(fling, math.abs(fling), fling);
				Events.announcement.fire(target, `${player.Name} trolled you!`, "TROLL");

				task.delay(2, () => {
					hrp.SetNetworkOwner(target);
				});
				return true;
			}
			return false;
		},

		[TrollDevproducts.Freeze]: (player: Player, target: Player) => {
			const FREEZE_TIME = 7;

			const character = target.Character;
			if (!character) return false;
			const humanoid = character?.FindFirstChild("Humanoid") as Humanoid;
			const hrp = character?.FindFirstChild("HumanoidRootPart") as Part;

			if (humanoid && hrp) {
				// Store original properties
				const originalWalkSpeed = humanoid.WalkSpeed;
				const originalJumpPower = humanoid.JumpPower;

				// Freeze the player
				hrp.SetNetworkOwner(undefined);
				humanoid.WalkSpeed = 0;
				humanoid.JumpPower = 0;
				humanoid.ChangeState(Enum.HumanoidStateType.Physics);

				// Create ice particle effect
				const iceEffect = new Instance("ParticleEmitter");
				iceEffect.Color = new ColorSequence(Color3.fromRGB(200, 255, 255));
				iceEffect.Size = new NumberSequence(0.5);
				iceEffect.Transparency = new NumberSequence(0.2);
				iceEffect.Lifetime = new NumberRange(1, 2);
				iceEffect.Rate = 50;
				iceEffect.Speed = new NumberRange(0.5, 1);
				iceEffect.SpreadAngle = new Vector2(25, 25);
				iceEffect.Parent = hrp;

				// Create frost effect on character parts
				for (const part of character.GetDescendants()) {
					if (part.IsA("BasePart") && part !== hrp) {
						const originalColor = part.Color;
						const originalMaterial = part.Material;

						part.Color = Color3.fromRGB(200, 235, 255);
						part.Material = Enum.Material.Ice;

						task.delay(FREEZE_TIME, () => {
							part.Color = originalColor;
							part.Material = originalMaterial;
						});
					}
				}

				task.delay(FREEZE_TIME, () => {
					if (character && character.Parent) {
						humanoid.WalkSpeed = originalWalkSpeed;
						humanoid.JumpPower = originalJumpPower;
						humanoid.ChangeState(Enum.HumanoidStateType.Running);
						hrp.SetNetworkOwner(target);
						iceEffect.Destroy();
					}
				});

				Events.announcement.fire(target, `${player.Name} trolled you!`, "TROLL");

				return true;
			}
			return false;
		},
	};

	private selectedPlayers: Map<Player, Player> = new Map();

	constructor(private readonly serverTimer: ServerTimer, private readonly playerDataService: PlayerDataService) {}

	onStart() {
		Events.selectTrolledPlayer.connect((player, target) => {
			if (!target || target.Parent !== Players || target === player) return;
			this.selectedPlayers.set(player, target);
		});

		Players.PlayerRemoving.Connect((player) => {
			this.selectedPlayers.delete(player);
		});

		const OWNERS = [201659547, 1242902085];

		MarketplaceService.ProcessReceipt = (receipt) => {
			const player = Players.GetPlayerByUserId(receipt.PlayerId);
			const productId = receipt.ProductId;
			const handler = this.productFunctions[productId];
			if (player && handler) {
				const isTroll = Object.values(TrollDevproducts).includes(productId);
				const target = isTroll ? this.selectedPlayers.get(player) : undefined;

				if ((isTroll && !target) || (target && target.Parent !== Players) || (target && target === player)) {
					return Enum.ProductPurchaseDecision.NotProcessedYet;
				}

				const [success, result] = pcall(handler, player, target!);
				if (success && result === true) {
					if (OWNERS.includes(receipt.PlayerId)) {
						return Enum.ProductPurchaseDecision.NotProcessedYet;
					}
					return Enum.ProductPurchaseDecision.PurchaseGranted;
				}
			}

			return Enum.ProductPurchaseDecision.NotProcessedYet;
		};
	}

	beginNukeSequence() {
		const nukeCc = Lighting.FindFirstChild("NukeCC") as ColorCorrectionEffect;
		const bloomEffect = new Instance("BloomEffect");
		bloomEffect.Intensity = 0;
		bloomEffect.Size = 24;
		bloomEffect.Threshold = 0.8;
		bloomEffect.Parent = Lighting;

		// Create dust and smoke particle emitters
		const createParticleEmitter = (
			name: string,
			color: Color3,
			size: NumberSequence,
			lifetime: NumberRange,
			speed: NumberRange,
			transparency: NumberSequence,
		) => {
			const emitter = new Instance("ParticleEmitter");
			emitter.Name = name;
			emitter.Color = new ColorSequence(color);
			emitter.Size = size;
			emitter.Lifetime = lifetime;
			emitter.Speed = speed;
			emitter.Rate = 0; // Will be controlled via burst
			emitter.SpreadAngle = new Vector2(180, 180);
			emitter.Transparency = transparency;
			emitter.LightEmission = 0.1;
			emitter.LightInfluence = 0.2;
			emitter.Acceleration = new Vector3(0, 10, 0);
			return emitter;
		};

		ReplicatedStorage.SetAttribute("Nuke", true);

		task.spawn(() => {
			// Sound effects
			const siren = Workspace.FindFirstChild("NukeSiren")! as Sound;
			siren.Stop();
			siren.Volume = 0.5;
			siren.TimePosition = 0;
			siren.Play();

			// Increase brightness and add orange tint to simulate nuclear flash
			const baseBrightness = Lighting.Brightness;
			const baseAmbient = Lighting.Ambient;
			const baseOutdoorAmbient = Lighting.OutdoorAmbient;

			TweenService.Create(Lighting, new TweenInfo(0.3), {
				Brightness: 8,
				Ambient: new Color3(1, 0.6, 0.3),
				OutdoorAmbient: new Color3(1, 0.8, 0.5),
			}).Play();
			TweenService.Create(bloomEffect, new TweenInfo(10), { Intensity: 2 }).Play();

			// Initial warning flashes
			for (const _ of $range(1, 10)) {
				task.wait(1);
				nukeCc.Enabled = !nukeCc.Enabled;

				// Add subtle screen shake during warning phase
				if (nukeCc.Enabled) {
					for (const player of Players.GetPlayers()) {
						if (player.Character && player.Character.FindFirstChild("Humanoid")) {
							const camera = player
								.FindFirstChildOfClass("PlayerGui")
								?.FindFirstChildOfClass("ScreenGui")
								?.FindFirstChildOfClass("Camera");
							if (camera) {
								TweenService.Create(camera, new TweenInfo(0.2, Enum.EasingStyle.Bounce), {
									FieldOfView: 75,
								}).Play();
								task.delay(0.2, () => {
									TweenService.Create(camera, new TweenInfo(0.3), { FieldOfView: 70 }).Play();
								});
							}
						}
					}
				}
			}

			// Detonation phase
			nukeCc.Enabled = true;

			// Increase bloom effect
			const rumble = Workspace.FindFirstChild("NukeRumbling")! as Sound;
			rumble.Stop();
			rumble.TimePosition = 0;
			rumble.Volume = 0.5;
			rumble.Play();

			// Create central explosion point
			const nukeOrigin = new Instance("Part");
			nukeOrigin.Anchored = true;
			nukeOrigin.CanCollide = false;
			nukeOrigin.Transparency = 1;
			nukeOrigin.Position = new Vector3(0, 50, 0); // Adjust position as needed for map center
			nukeOrigin.Parent = Workspace;

			// Create shockwave effect
			const shockwave = new Instance("Part");
			shockwave.Shape = Enum.PartType.Cylinder;
			shockwave.Orientation = new Vector3(0, 0, 90);
			shockwave.Material = Enum.Material.Neon;
			shockwave.Transparency = 0.6;
			shockwave.Color = new Color3(1, 0.7, 0.3);
			shockwave.Size = new Vector3(1, 1, 1);
			shockwave.Anchored = true;
			shockwave.CanCollide = false;
			shockwave.CastShadow = false;
			shockwave.Parent = Workspace;

			// Animate shockwave
			const shockwaveTween = TweenService.Create(
				shockwave,
				new TweenInfo(2, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
				{
					Size: new Vector3(1, 1000, 1000),
					Transparency: 1,
				},
			);
			shockwaveTween.Play();

			// Create smoke and dust clouds
			const smokeEmitter = createParticleEmitter(
				"NukeSmoke",
				new Color3(0.5, 0.5, 0.5),
				new NumberSequence(100, 200),
				new NumberRange(8, 12),
				new NumberRange(20, 40),
				new NumberSequence([
					new NumberSequenceKeypoint(0, 0.2),
					new NumberSequenceKeypoint(0.2, 0.5),
					new NumberSequenceKeypoint(1, 1),
				]),
			);
			smokeEmitter.Parent = nukeOrigin;

			const dustEmitter = createParticleEmitter(
				"NukeDust",
				new Color3(0.8, 0.7, 0.6),
				new NumberSequence(50, 150),
				new NumberRange(5, 10),
				new NumberRange(15, 30),
				new NumberSequence([
					new NumberSequenceKeypoint(0, 0.3),
					new NumberSequenceKeypoint(0.3, 0.6),
					new NumberSequenceKeypoint(1, 1),
				]),
			);
			dustEmitter.Parent = nukeOrigin;

			// Emit massive burst of particles
			smokeEmitter.Emit(100);
			dustEmitter.Emit(150);

			task.wait(0.5); // Short delay before player effects

			// Apply effects to players
			for (const player of Players.GetPlayers()) {
				const character = player.Character;
				if (!character) continue;

				const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
				if (!humanoid) continue;

				// Camera shake effect
				const playerGui = player.FindFirstChild("PlayerGui") as PlayerGui;
				if (playerGui) {
					const screenShake = new Instance("ScreenGui");
					screenShake.Name = "NukeShake";
					screenShake.Parent = playerGui;

					task.spawn(() => {
						for (const _ of $range(1, 10)) {
							const camera = player.FindFirstChildOfClass("Camera");
							if (camera) {
								camera.CFrame = camera.CFrame.add(
									new Vector3(math.random(-1, 1), math.random(-1, 1), math.random(-1, 1)),
								);
							}
							task.wait(0.05);
						}
						screenShake.Destroy();
					});
				}

				// Player physics and damage effects
				humanoid.RootPart?.SetNetworkOwner(undefined);
				humanoid.TakeDamage(humanoid.MaxHealth);

				// Create personal explosion for each player
				const explosion = new Instance("Explosion");
				explosion.Position = character.GetPivot().Position;
				explosion.DestroyJointRadiusPercent = 0;
				explosion.BlastPressure = 10000;
				explosion.BlastRadius = 50;
				explosion.Parent = Workspace.Terrain;

				// Create dust cloud at player's position
				const playerDust = createParticleEmitter(
					"PlayerDust",
					new Color3(0.7, 0.65, 0.6),
					new NumberSequence(20, 40),
					new NumberRange(3, 5),
					new NumberRange(10, 20),
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.4),
						new NumberSequenceKeypoint(0.2, 0.7),
						new NumberSequenceKeypoint(1, 1),
					]),
				);
				playerDust.Parent = explosion;
				playerDust.Emit(40);

				// Apply force to character parts
				for (const bodyPart of character.GetChildren()) {
					if (bodyPart.IsA("BasePart")) {
						const fling = math.random(-250, 250);
						bodyPart.AssemblyAngularVelocity = new Vector3(fling, math.abs(fling), fling);
						bodyPart.AssemblyLinearVelocity = new Vector3(fling, math.abs(fling), fling);

						// Add smoke trail to each body part
						const trailEmitter = createParticleEmitter(
							"BodyTrail",
							new Color3(0.6, 0.6, 0.6),
							new NumberSequence(5, 10),
							new NumberRange(1, 2),
							new NumberRange(1, 3),
							new NumberSequence([new NumberSequenceKeypoint(0, 0.7), new NumberSequenceKeypoint(1, 1)]),
						);
						trailEmitter.Parent = bodyPart;
						trailEmitter.Rate = 20;

						// Auto-clean trail after 2 seconds
						task.delay(2, () => {
							trailEmitter.Rate = 0;
							task.delay(3, () => {
								trailEmitter.Destroy();
							});
						});
					}
				}

				Debris.AddItem(explosion, 1.5);
			}

			// Create secondary dust clouds in the environment
			for (const _ of $range(1, 10)) {
				const randomPos = new Vector3(math.random(-100, 100), 0, math.random(-100, 100));

				const dustCloud = new Instance("Part");
				dustCloud.Anchored = true;
				dustCloud.CanCollide = false;
				dustCloud.Transparency = 1;
				dustCloud.Position = randomPos;
				dustCloud.Parent = Workspace;

				const envDust = createParticleEmitter(
					"EnvironmentDust",
					new Color3(0.75, 0.7, 0.65),
					new NumberSequence(60, 100),
					new NumberRange(5, 7),
					new NumberRange(15, 25),
					new NumberSequence([
						new NumberSequenceKeypoint(0, 0.3),
						new NumberSequenceKeypoint(0.4, 0.7),
						new NumberSequenceKeypoint(1, 1),
					]),
				);
				envDust.Parent = dustCloud;
				envDust.Emit(50);

				Debris.AddItem(dustCloud, 8);
			}

			// Gradually return lighting to normal
			task.wait(3);
			TweenService.Create(Lighting, new TweenInfo(4), {
				Brightness: baseBrightness,
				Ambient: baseAmbient,
				OutdoorAmbient: baseOutdoorAmbient,
			}).Play();

			TweenService.Create(bloomEffect, new TweenInfo(3), { Intensity: 0 }).Play();

			// Cleanup central effects
			task.delay(6, () => {
				nukeOrigin.Destroy();
				shockwave.Destroy();
				bloomEffect.Destroy();
			});

			ReplicatedStorage.SetAttribute("Nuke", false);
			nukeCc.Enabled = false;
			TweenService.Create(siren, new TweenInfo(1.5), { Volume: 0 }).Play();
		});
	}
}
