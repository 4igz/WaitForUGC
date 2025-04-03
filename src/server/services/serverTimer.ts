import { Service, OnStart } from "@flamework/core";
import { CollectionService, Lighting, MarketplaceService, Players, TweenService, Workspace } from "@rbxts/services";
import { interval } from "shared/interval";
import { PlayerDataService } from "./playerDataService";
import Signal from "@rbxts/lemon-signal";
import { Events, Functions } from "server/network";

const subtractionCooldown = interval(15);

const UGC_ASSET_ID = 84779678830872;

@Service({})
export class ServerTimer implements OnStart {
	public timeChanged = new Signal<(timeLeft: number) => void>();
	public minute = 60;
	public hour = this.minute * 60;
	public day = this.hour * 24;
	public month = this.day * 30.41666666666667;
	public year = this.day * 365;

	public timeLeft: number = this.year;

	private awaitingResponses: Map<Player, number> = new Map();

	private effectsOrigin: BasePart = Workspace.WaitForChild("EffectOrigin") as BasePart;

	private endRunning = false;

	constructor(private readonly playerDataService: PlayerDataService) {}

	onStart() {
		Players.PlayerRemoving.Connect((player) => {
			this.awaitingResponses.delete(player);
		});

		Functions.getUnlockedObbies.setCallback((player) => {
			const profile = this.playerDataService.getProfileLoaded(player).expect();

			return profile.Data.completedObbies;
		});

		Events.timeOptionResponse.connect((player, amount) => {
			const responseValue = this.awaitingResponses.get(player);
			if (responseValue === undefined) return;

			if (responseValue !== math.abs(amount)) {
				warn(`Player ${player.Name} responded with incorrect value`);
				Events.selfReport.predict(player, "Incorrect Time Response");
				return;
			}

			const hrp = player.Character?.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
			if (!hrp) return;

			hrp.Anchored = true;

			this.playerDataService
				.getProfileLoaded(player)
				.then((profile) => {
					if (profile.Data.isExploiter) {
						player.LoadCharacter();
						return;
					} else {
						Events.returnPlayerToLobby(player);
					}
					if (amount > 0) {
						profile.Data.cash += amount / 10;
					} else {
						profile.Data.subtractedTime += math.abs(amount);
					}
					this.timeLeft += amount > 0 ? amount : amount / 2;
					this.timeChanged.Fire(this.timeLeft);
					this.playerDataService.setProfile(player, profile);
				})
				.catch((e) => {
					warn(e);
				});
		});

		CollectionService.GetTagged("TimeOption").forEach((instance: Instance) => {
			if (!instance.IsA("BasePart")) {
				return;
			}

			const amount = instance.GetAttribute("Seconds") as number | undefined;
			const MIN_DIST = 40;

			if (amount === undefined) {
				warn(`TimeOption part ${instance.GetFullName()} is missing Seconds attribute`);
				return;
			}

			instance.Touched.Connect((touchingPart) => {
				const character = touchingPart.Parent as Model | undefined;
				const player = Players.GetPlayerFromCharacter(character);
				if (player && character && subtractionCooldown(player.UserId)) {
					const playerPosition = character.GetPivot().Position;
					if (!playerPosition) return;
					const dist = touchingPart.Position.sub(playerPosition).Magnitude;
					if (dist > MIN_DIST) return;
					const profile = this.playerDataService.getProfileLoaded(player).expect();

					const obbyNum = instance.Parent?.GetAttribute("ObbyNum") as number | undefined;
					if (obbyNum !== undefined) {
						if (profile.Data.completedObbies < obbyNum - 1) {
							Events.selfReport.predict(
								player,
								"Touching obby completion part before completing previous obby",
							);
							player.LoadCharacter();
							return;
						}
						Events.unlockObbies(player, obbyNum);
						this.playerDataService.getProfileLoaded(player).then((profile) => {
							if (profile.Data.completedObbies < obbyNum) {
								profile.Data.completedObbies = obbyNum;
								this.playerDataService.setProfile(player, profile);
							}
						});
					}

					const hrp = character.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
					if (!hrp) return;

					hrp.Anchored = true;

					this.awaitingResponses.set(player, amount);
					Events.displayTimeOption(player, amount);
				}
			});
		});

		CollectionService.GetTagged("TimerText").forEach((instance: Instance) => {
			if (!instance.IsA("TextLabel")) {
				return;
			}

			this.timeChanged.Connect((seconds) => {
				const years = math.floor(seconds / this.year);
				const months = math.floor((seconds % this.year) / this.month);
				const days = math.floor((seconds % this.month) / this.day);
				const hours = math.floor((seconds % this.day) / this.hour);
				const minutes = math.floor((seconds % this.hour) / this.minute);
				const secs = seconds % this.minute;

				let timeString = "";
				if (years > 0) {
					timeString += `${years} years `;
				}
				if (months > 0 || timeString !== "") {
					timeString += `${months} months `;
				}
				if (days > 0 || timeString !== "") {
					timeString += `${days} days `;
				}
				if (hours > 0 || timeString !== "") {
					timeString += `${hours} hours `;
				}
				if (minutes > 0 || timeString !== "") {
					timeString += `${minutes} minutes `;
				}
				if (secs > 0 || timeString !== "") {
					timeString += `${secs} seconds left`;
				}

				instance.Text = timeString;
			});
		});

		while (true) {
			task.wait(1);
			if (this.endRunning) continue;
			this.timeLeft -= 1;
			this.timeChanged.Fire(this.timeLeft);
			this.timeLeft = math.floor(this.timeLeft);

			if (this.timeLeft <= 0) {
				this.timerFinishedSequence();
				this.timeLeft = this.year;
			}
		}
	}

	timerFinishedSequence(): void {
		this.endRunning = true;
		// Create initial burst of lights
		this.createInitialBurst();

		// Run the main sequence
		this.runGrandFinaleSequence();
	}

	private createInitialBurst(): void {
		// Create particle emitters for the initial burst
		const burstEmitter = new Instance("ParticleEmitter");
		burstEmitter.Color = new ColorSequence([
			new ColorSequenceKeypoint(0, Color3.fromRGB(255, 0, 0)),
			new ColorSequenceKeypoint(0.2, Color3.fromRGB(255, 165, 0)),
			new ColorSequenceKeypoint(0.4, Color3.fromRGB(255, 255, 0)),
			new ColorSequenceKeypoint(0.6, Color3.fromRGB(0, 255, 0)),
			new ColorSequenceKeypoint(0.8, Color3.fromRGB(0, 0, 255)),
			new ColorSequenceKeypoint(1, Color3.fromRGB(128, 0, 128)),
		]);
		burstEmitter.Size = new NumberSequence([new NumberSequenceKeypoint(0, 2), new NumberSequenceKeypoint(1, 0.5)]);
		burstEmitter.Lifetime = new NumberRange(2, 3);
		burstEmitter.Speed = new NumberRange(20, 40);
		burstEmitter.SpreadAngle = new Vector2(180, 180);
		burstEmitter.Rate = 0;
		burstEmitter.Acceleration = new Vector3(0, -10, 0);
		burstEmitter.Parent = this.effectsOrigin;

		// Emit a burst of particles
		burstEmitter.Emit(100);

		// Clean up after burst
		task.delay(3, () => {
			burstEmitter.Destroy();
		});
	}

	private async runGrandFinaleSequence(): Promise<void> {
		// Create lighting service reference
		const lighting = game.GetService("Lighting");
		const origAmbient = lighting.Ambient;
		const origOutdoorAmbient = lighting.OutdoorAmbient;

		const finaleMusic = Workspace.WaitForChild("GrandFinale") as Sound;
		finaleMusic.TimePosition = 0;
		finaleMusic.Volume = 0.5;
		finaleMusic.Play();

		// Laser array effect
		this.createLaserArray();

		await this.rainbowFog();
		// Spinning vortex effect
		await this.createVortexEffect();

		// Final explosive burst
		await this.createFinalExplosion();
		// Restore original lighting

		TweenService.Create(finaleMusic, new TweenInfo(4, Enum.EasingStyle.Linear, Enum.EasingDirection.Out), {
			Volume: 0,
		}).Play();

		this.transitionToAmbient(lighting, origAmbient, origOutdoorAmbient);

		for (const player of Players.GetPlayers()) {
			this.playerDataService.getProfileLoaded(player).then((profile) => {
				if (profile.Data.isExploiter) return;
				profile.Data.cash += 1_000_000;
				this.playerDataService.setProfile(player, profile);
				MarketplaceService.PromptPurchase(player, UGC_ASSET_ID);
			});
		}

		this.endRunning = false;
	}

	private async rainbowFog(): Promise<void> {
		const lighting = game.GetService("Lighting");
		const atmosphere = lighting.WaitForChild("Atmosphere") as Atmosphere;

		// Store original atmosphere properties
		const originalDensity = atmosphere.Density;
		const originalColor = atmosphere.Color;
		const originalDecay = atmosphere.Decay;
		const originalGlare = atmosphere.Glare;
		const originalHaze = atmosphere.Haze;

		// Rainbow colors
		const rainbowColors = [
			Color3.fromRGB(255, 0, 0), // Red
			Color3.fromRGB(255, 127, 0), // Orange
			Color3.fromRGB(255, 255, 0), // Yellow
			Color3.fromRGB(0, 255, 0), // Green
			Color3.fromRGB(0, 127, 255), // Blue
			Color3.fromRGB(75, 0, 130), // Indigo
			Color3.fromRGB(148, 0, 211), // Violet
		];

		// Create fog parts
		const fogParts: Part[] = [];
		const radius = 100;
		const height = 20;

		for (let i = 0; i < rainbowColors.size(); i++) {
			const angle = (i / rainbowColors.size()) * math.pi * 2;
			const color = rainbowColors[i];

			// Create fog part
			const fogPart = new Instance("Part");
			fogPart.Name = `RainbowFog_${i}`;
			fogPart.Anchored = true;
			fogPart.CanCollide = false;
			fogPart.Size = new Vector3(radius / 2, height, radius / 2);
			fogPart.Position = new Vector3(math.cos(angle) * (radius / 3), 0, math.sin(angle) * (radius / 3));
			fogPart.Transparency = 0.7;
			fogPart.Color = color;
			fogPart.Material = Enum.Material.Neon;
			fogPart.Parent = lighting;

			// Add particle emitter for fog effect
			const fogEmitter = new Instance("ParticleEmitter");
			fogEmitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, color),
				new ColorSequenceKeypoint(1, color),
			]);
			fogEmitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, 5),
				new NumberSequenceKeypoint(0.5, 8),
				new NumberSequenceKeypoint(1, 5),
			]);
			fogEmitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, 0.7),
				new NumberSequenceKeypoint(0.5, 0.8),
				new NumberSequenceKeypoint(1, 0.9),
			]);
			fogEmitter.Lifetime = new NumberRange(5, 8);
			fogEmitter.Rate = 50;
			fogEmitter.Speed = new NumberRange(1, 3);
			fogEmitter.SpreadAngle = new Vector2(180, 180);
			fogEmitter.Parent = fogPart;

			fogParts.push(fogPart);
		}

		// Modify atmosphere for misty effect
		atmosphere.Density = 0.5;
		atmosphere.Color = Color3.fromRGB(200, 200, 255);
		atmosphere.Decay = Color3.fromRGB(100, 100, 150);
		atmosphere.Glare = 0.3;
		atmosphere.Haze = 2;

		// Create fog animation
		let elapsed = 0;
		const duration = 25; // How long the fog effect lasts

		const fogConnection = game.GetService("RunService").Heartbeat.Connect((dt) => {
			elapsed += dt;

			if (elapsed >= duration) {
				// Clean up
				fogConnection.Disconnect();
				resetAtmosphere();
				cleanup();
				return;
			}

			// Animate fog
			fogParts.forEach((part, i) => {
				// Rotate parts slowly
				const angle = (i / rainbowColors.size()) * math.pi * 2 + elapsed * 0.1;
				part.Position = new Vector3(
					math.cos(angle) * (radius / 3),
					math.sin(elapsed * 0.2) * 5, // Float up and down
					math.sin(angle) * (radius / 3),
				);

				// Pulse size
				const pulse = math.sin(elapsed * 2 + i) * 0.2 + 0.8;
				part.Size = new Vector3((radius / 2) * pulse, height, (radius / 2) * pulse);

				// Cycle through colors
				const colorIndex = (i + math.floor(elapsed)) % rainbowColors.size();
				const nextColorIndex = (colorIndex + 1) % rainbowColors.size();
				const lerpAmount = elapsed % 1;

				const targetColor = rainbowColors[colorIndex].Lerp(rainbowColors[nextColorIndex], lerpAmount);

				part.Color = part.Color.Lerp(targetColor, 0.05);

				// Update particle emitter color
				const emitter = part.FindFirstChildOfClass("ParticleEmitter") as ParticleEmitter;
				if (emitter) {
					emitter.Color = new ColorSequence([
						new ColorSequenceKeypoint(0, part.Color),
						new ColorSequenceKeypoint(1, part.Color),
					]);
				}
			});

			// Cycle atmosphere colors
			const atmColorIndex = math.floor(elapsed * 0.5) % rainbowColors.size();
			const nextAtmColorIndex = (atmColorIndex + 1) % rainbowColors.size();
			const atmLerpAmount = (elapsed * 0.5) % 1;

			const targetAtmColor = rainbowColors[atmColorIndex].Lerp(rainbowColors[nextAtmColorIndex], atmLerpAmount);

			// Apply subtle atmospheric color changes
			atmosphere.Color = atmosphere.Color.Lerp(
				new Color3(targetAtmColor.R * 0.3 + 0.7, targetAtmColor.G * 0.3 + 0.7, targetAtmColor.B * 0.3 + 0.7),
				0.05,
			);
		});

		// Create light rays coming through the fog
		for (let i = 0; i < 5; i++) {
			const ray = new Instance("Part");
			ray.Name = `FogLightRay_${i}`;
			ray.Anchored = true;
			ray.CanCollide = false;
			ray.Transparency = 0.7;
			ray.Material = Enum.Material.Neon;
			ray.Size = new Vector3(1, 200, 1);
			ray.Position = new Vector3(math.random(-radius / 2, radius / 2), 100, math.random(-radius / 2, radius / 2));
			ray.Orientation = new Vector3(math.random(-10, 10), math.random(0, 360), math.random(-10, 10));
			ray.Color = Color3.fromRGB(255, 255, 255);
			ray.Parent = lighting;

			fogParts.push(ray);
		}

		// Reset atmosphere function
		const resetAtmosphere = () => {
			atmosphere.Density = originalDensity;
			atmosphere.Color = originalColor;
			atmosphere.Decay = originalDecay;
			atmosphere.Glare = originalGlare;
			atmosphere.Haze = originalHaze;
		};

		// Cleanup function
		const cleanup = () => {
			fogParts.forEach((part) => {
				part.Destroy();
			});
		};

		// Return a promise that resolves when the rainbow fog is complete
		return new Promise<void>((resolve) => {
			task.delay(duration, () => {
				if (fogConnection.Connected) {
					fogConnection.Disconnect();
				}
				resetAtmosphere();
				cleanup();
				resolve();
			});
		});
	}

	private createLaserArray(): Promise<void> {
		return new Promise<void>((resolve) => {
			const beams: Part[] = [];
			const beamColors = [
				Color3.fromRGB(0, 100, 255), // Blue
				Color3.fromRGB(170, 0, 255), // Purple
				Color3.fromRGB(0, 255, 255), // Cyan
			];

			// Create laser beams
			for (let i = 0; i < 35; i++) {
				const beam = new Instance("Part");
				beam.Anchored = true;
				beam.CanCollide = false;
				beam.Material = Enum.Material.Neon;
				beam.Size = new Vector3(0.5, 0.5, 250);
				beam.Color = beamColors[i % beamColors.size()];
				beam.CFrame = new CFrame(this.effectsOrigin.Position)
					.mul(CFrame.Angles(0, (i / 12) * math.pi * 2, 0))
					.mul(CFrame.Angles(math.rad(-5), 0, 0))
					.mul(new CFrame(0, 0, -25));
				beam.Parent = this.effectsOrigin;

				// Add a bit of glow
				const pointLight = new Instance("PointLight");
				pointLight.Color = beam.Color;
				pointLight.Range = 10;
				pointLight.Brightness = 2;
				pointLight.Parent = beam;

				beams.push(beam);
			}

			// Animate the laser sweep
			let elapsedTime = 0;
			const duration = 25;
			const sweepConnection = game.GetService("RunService").Heartbeat.Connect((dt) => {
				elapsedTime += dt;
				const progress = elapsedTime / duration;

				// Sweep the beams
				beams.forEach((beam, i) => {
					const startAngle = (i / 12) * math.pi * 2;
					const sweepAngle = math.sin(progress * math.pi) * math.rad(90);

					beam.CFrame = new CFrame(this.effectsOrigin.Position)
						.mul(CFrame.Angles(0, startAngle + sweepAngle, 0))
						.mul(CFrame.Angles(math.rad(-5 - progress * 10), 0, 0))
						.mul(new CFrame(0, 0, -25));
				});

				if (progress >= 1) {
					sweepConnection.Disconnect();
					beams.forEach((beam) => {
						TweenService.Create(beam, new TweenInfo(5, Enum.EasingStyle.Linear, Enum.EasingDirection.Out), {
							Transparency: 1,
						}).Play();
					});
					resolve();
				}
			});

			// Safety cleanup
			task.delay(duration + 6, () => {
				sweepConnection.Disconnect();
				beams.forEach((beam) => {
					beam.Destroy();
				});
				resolve();
			});
		});
	}

	private createVortexEffect(): Promise<void> {
		return new Promise<void>((resolve) => {
			const vortexColors = [
				Color3.fromRGB(0, 255, 0), // Green
				Color3.fromRGB(0, 100, 255), // Blue
				Color3.fromRGB(170, 0, 255), // Purple
			];

			// Create central emitter
			const emitter = new Instance("ParticleEmitter");
			emitter.Color = new ColorSequence([
				new ColorSequenceKeypoint(0, vortexColors[0]),
				new ColorSequenceKeypoint(0.5, vortexColors[1]),
				new ColorSequenceKeypoint(1, vortexColors[2]),
			]);
			emitter.Size = new NumberSequence([
				new NumberSequenceKeypoint(0, 0.8),
				new NumberSequenceKeypoint(0.5, 1.2),
				new NumberSequenceKeypoint(1, 0.4),
			]);
			emitter.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, 0.2),
				new NumberSequenceKeypoint(0.8, 0.5),
				new NumberSequenceKeypoint(1, 1),
			]);
			emitter.Lifetime = new NumberRange(1, 2);
			emitter.Speed = new NumberRange(15, 20);
			emitter.SpreadAngle = new Vector2(180, 180);
			emitter.Rate = 300;

			const emitterPart = new Instance("Part");
			emitterPart.Anchored = true;
			emitterPart.CanCollide = false;
			emitterPart.Transparency = 1;
			emitterPart.Size = new Vector3(1, 1, 1);
			emitterPart.Position = this.effectsOrigin.Position.add(new Vector3(0, 10, 0));
			emitterPart.Parent = this.effectsOrigin;

			emitter.Parent = emitterPart;

			// Create force field to give vortex shape
			const forceField = new Instance("VectorForce");
			forceField.RelativeTo = Enum.ActuatorRelativeTo.World;
			forceField.ApplyAtCenterOfMass = true;

			// Add spinning motion
			let elapsedTime = 0;
			const vortexConnection = game.GetService("RunService").Heartbeat.Connect((dt) => {
				elapsedTime += dt;

				// Create spinning force effect
				emitterPart.CFrame = new CFrame(emitterPart.Position).mul(CFrame.Angles(0, elapsedTime * 2, 0));

				// Vary the emission rate for more dynamic effect
				const pulse = math.sin(elapsedTime * 3) * 0.5 + 0.5;
				emitter.Rate = 200 + pulse * 200;
			});

			// Run for 4 seconds
			task.delay(4, () => {
				vortexConnection.Disconnect();
				emitter.Rate = 0;
				task.delay(2, () => {
					emitterPart.Destroy();
					resolve();
				});
			});
		});
	}

	private createFinalExplosion(): Promise<void> {
		return new Promise<void>((resolve) => {
			const explosionColors = [
				Color3.fromRGB(255, 215, 0), // Gold
				Color3.fromRGB(192, 192, 192), // Silver
				Color3.fromRGB(255, 0, 0), // Red
				Color3.fromRGB(0, 0, 255), // Blue
				Color3.fromRGB(170, 0, 255), // Purple
				Color3.fromRGB(0, 255, 0), // Green
			];

			// Create multiple explosion points
			for (let i = 0; i < 20; i++) {
				task.delay(math.random() * 2, () => {
					// Random position for explosion
					const angle = math.random() * math.pi * 2;
					const radius = math.random() * 30;
					const height = math.random() * 30;
					const position = this.effectsOrigin.Position.add(
						new Vector3(math.cos(angle) * radius, height, math.sin(angle) * radius),
					);

					// Create explosion emitter
					const emitter = new Instance("ParticleEmitter");
					emitter.Color = new ColorSequence([
						new ColorSequenceKeypoint(0, explosionColors[i % explosionColors.size()]),
						new ColorSequenceKeypoint(0.5, explosionColors[(i + 2) % explosionColors.size()]),
						new ColorSequenceKeypoint(1, explosionColors[(i + 4) % explosionColors.size()]),
					]);
					emitter.Size = new NumberSequence([
						new NumberSequenceKeypoint(0, 1),
						new NumberSequenceKeypoint(0.2, 2),
						new NumberSequenceKeypoint(1, 0.5),
					]);
					emitter.Transparency = new NumberSequence([
						new NumberSequenceKeypoint(0, 0),
						new NumberSequenceKeypoint(0.8, 0.5),
						new NumberSequenceKeypoint(1, 1),
					]);
					emitter.Lifetime = new NumberRange(2, 3);
					emitter.Speed = new NumberRange(20, 40);
					emitter.SpreadAngle = new Vector2(180, 180);
					emitter.Rate = 0; // We'll use Emit instead

					const part = new Instance("Part");
					part.Anchored = true;
					part.CanCollide = false;
					part.Transparency = 1;
					part.Size = new Vector3(1, 1, 1);
					part.Position = position;
					part.Parent = this.effectsOrigin;

					emitter.Parent = part;

					// Add light for glow effect
					const light = new Instance("PointLight");
					light.Color = explosionColors[i % explosionColors.size()];
					light.Range = 15;
					light.Brightness = 2;
					light.Parent = part;

					// Emit particles in burst
					emitter.Emit(100);

					// Clean up after animation
					task.delay(3, () => {
						part.Destroy();
					});
				});
			}

			// Complete after all explosions
			task.delay(5, () => {
				resolve();
			});
		});
	}

	private transitionToAmbient(lighting: Lighting, origAmbient: Color3, origOutdoorAmbient: Color3): void {
		// Gradual transition back to normal lighting
		const startTime = tick();
		const duration = 3;
		const startAmbient = lighting.Ambient;
		const startBrightness = lighting.Brightness;

		const atmosphere = lighting.WaitForChild("Atmosphere") as Atmosphere;

		TweenService.Create(atmosphere, new TweenInfo(duration), {
			Density: 0.3,
			Color: Color3.fromRGB(199, 199, 199),
			Decay: Color3.fromRGB(106, 112, 125),
			Glare: 0,
			Haze: 0,
		}).Play();

		const transitionConnection = game.GetService("RunService").Heartbeat.Connect(() => {
			const elapsed = tick() - startTime;
			const alpha = math.min(elapsed / duration, 1);

			// Lerp back to original values
			lighting.Ambient = startAmbient.Lerp(origAmbient, alpha);
			lighting.Brightness = startBrightness * (1 - alpha) + 1 * alpha;

			if (alpha >= 1) {
				transitionConnection.Disconnect();
			}
		});

		// Ensure cleanup
		task.delay(duration + 0.5, () => {
			transitionConnection.Disconnect();
			lighting.Ambient = origAmbient;
			lighting.OutdoorAmbient = origOutdoorAmbient;
			lighting.Brightness = 1;
		});
	}
}
