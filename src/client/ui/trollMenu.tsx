import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";
import { MarketplaceService, Players, Workspace } from "@rbxts/services";
import { Events } from "client/network";
import { springs } from "client/utils/springs";

const visitedPlayers: Array<Player> = [];

const getPreviousPlayer = () => {
	if (visitedPlayers.size() === 0) return getNextPlayer();

	return visitedPlayers.pop();
};

const getNextPlayer = () => {
	let players = game
		.GetService("Players")
		.GetPlayers()
		.filter((player) => !visitedPlayers.includes(player) && player !== Players.LocalPlayer);

	if (players.size() === 0) {
		visitedPlayers.clear();
		players = game
			.GetService("Players")
			.GetPlayers()
			.filter((player) => player !== Players.LocalPlayer);
	}

	if (players.size() === 0) return;

	const player = players[math.random(0, players.size() - 1)];

	if (player === undefined) return;

	visitedPlayers.push(player);
	return player;
};

const TrollDevproducts = {
	Kill: 3237539576,
	Trip: 3237538908,
	Freeze: 3237539459,
	Fling: 3237539213,
};

let closed = false;
let readyToOpen = true;

export const TrollMenu = () => {
	const [menuOpen, setMenuOpen] = React.useState(false);
	const [selectedPlayer, setSelectedPlayer] = React.useState<Player | undefined>(undefined);

	const [pos, setPos] = useMotion(UDim2.fromScale(1.05, 0.5));

	useEffect(() => {
		setPos.onComplete(() => {
			if (closed) {
				closed = false;
				return;
			}
			readyToOpen = true;
		});

		setPos.onStep(() => {
			readyToOpen = false;
		});
	}, []);

	useEffect(() => {
		if (menuOpen) {
			setPos.immediate(UDim2.fromScale(1, 0.5));
			const nextPlayer = getNextPlayer();
			if (nextPlayer) {
				setSelectedPlayer(nextPlayer);
				Events.selectTrolledPlayer(nextPlayer);
			}
		} else {
			readyToOpen = false;
			closed = true;
			setPos.immediate(UDim2.fromScale(1.035, 0.5));
			task.wait(0.2);
			setPos.spring(UDim2.fromScale(1.05, 0.5), springs.molasses);
			setSelectedPlayer(undefined);
		}
	}, [menuOpen]);

	useEffect(() => {
		const camera = Workspace.CurrentCamera;

		if (!camera) return;

		if (selectedPlayer) {
			const character = selectedPlayer.Character;
			if (!character) return;
			const selectedHumanoid = character.FindFirstChildOfClass("Humanoid");

			if (!selectedHumanoid) return;

			camera.CameraSubject = selectedHumanoid;

			const connection = selectedPlayer.CharacterAdded.Connect((character) => {
				const camera = Workspace.CurrentCamera;
				if (!camera) return;
				const selectedHumanoid = character.WaitForChild("Humanoid") as Humanoid;
				camera.CameraSubject = selectedHumanoid;
			});

			return () => {
				connection.Disconnect();
			};
		} else {
			camera.CameraSubject = Players.LocalPlayer.Character?.FindFirstChildOfClass("Humanoid");
		}
	}, [selectedPlayer]);

	return (
		<frame
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BackgroundTransparency={1}
			BorderColor3={Color3.fromRGB(0, 0, 0)}
			BorderSizePixel={0}
			key={"TrollMenuContainer"}
			Size={UDim2.fromScale(1, 1)}
		>
			<frame
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(0, 0, 0)}
				BorderSizePixel={0}
				key={"Spectate"}
				Position={UDim2.fromScale(0.5, 0.88)}
				Size={UDim2.fromScale(0.5, 0.154)}
				Visible={menuOpen}
			>
				<imagebutton
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					Image={"rbxassetid://12943291888"}
					key={"Left"}
					Position={UDim2.fromScale(0.26, 0.263)}
					Rotation={90}
					Size={UDim2.fromScale(0.1, 0.473)}
					Event={{
						MouseButton1Click: () => {
							setSelectedPlayer(getPreviousPlayer());
						},
					}}
				/>

				<textlabel
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					FontFace={
						new Font("rbxasset://fonts/families/Roboto.json", Enum.FontWeight.Bold, Enum.FontStyle.Normal)
					}
					key={"Name"}
					Position={UDim2.fromScale(0.5, 0.5)}
					Size={UDim2.fromScale(0.35, 1)}
					Text={selectedPlayer?.Name}
					TextColor3={Color3.fromRGB(255, 255, 255)}
					TextSize={30}
					TextWrapped={true}
				>
					<uistroke key={"UIStroke"} Thickness={2} />
				</textlabel>

				<imagebutton
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					Image={"rbxassetid://12943291888"}
					key={"Right"}
					Position={UDim2.fromScale(0.645, 0.263)}
					Rotation={270}
					Size={UDim2.fromScale(0.1, 0.473)}
					Event={{
						MouseButton1Click: () => {
							setSelectedPlayer(getNextPlayer());
						},
					}}
				/>
			</frame>

			<frame
				AnchorPoint={new Vector2(1, 0.5)}
				BackgroundColor3={Color3.fromRGB(6, 160, 255)}
				BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(0, 0, 0)}
				BorderSizePixel={0}
				key={"TrollMenu"}
				Position={pos}
				Size={UDim2.fromScale(0.0555, 0.645)}
			>
				<uiaspectratioconstraint key={"UIAspectRatioConstraint"} AspectRatio={0.228} />

				<frame
					BackgroundColor3={Color3.fromRGB(6, 160, 255)}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					key={"Sidebar"}
					Size={UDim2.fromScale(1, 1)}
					Visible={menuOpen}
				>
					<imagebutton
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						Image={"rbxassetid://115669739343021"}
						LayoutOrder={3}
						key={"Kill"}
						Size={UDim2.fromScale(1, 0.195)}
						Event={{
							MouseButton1Click: () => {
								if (selectedPlayer === undefined) return;
								MarketplaceService.PromptProductPurchase(Players.LocalPlayer, TrollDevproducts.Kill);
							},
						}}
					>
						<textlabel
							key={"TextLabel"}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundColor3={Color3.fromRGB(255, 255, 255)}
							BackgroundTransparency={1}
							BorderColor3={Color3.fromRGB(0, 0, 0)}
							BorderSizePixel={0}
							FontFace={new Font("rbxasset://fonts/families/Bangers.json")}
							Position={UDim2.fromScale(0, 1)}
							Size={UDim2.fromScale(1, 0.301)}
							Text={"KILL"}
							TextColor3={Color3.fromRGB(255, 0, 0)}
							TextScaled={true}
							TextStrokeColor3={Color3.fromRGB(255, 0, 4)}
							TextWrapped={true}
						>
							<uistroke key={"UIStroke"} Thickness={2} />
						</textlabel>
					</imagebutton>

					<imagebutton
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						Image={"rbxassetid://7120897383"}
						LayoutOrder={-1}
						key={"TrollFace"}
						Size={UDim2.fromScale(1, 0.2)}
						Event={{
							MouseButton1Click: () => {
								setMenuOpen(false);
							},
						}}
					>
						<textlabel
							key={"TextLabel"}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundColor3={Color3.fromRGB(255, 255, 255)}
							BackgroundTransparency={1}
							BorderColor3={Color3.fromRGB(0, 0, 0)}
							BorderSizePixel={0}
							FontFace={new Font("rbxasset://fonts/families/LuckiestGuy.json")}
							Position={UDim2.fromScale(0, 1)}
							Size={UDim2.fromScale(1, 0.301)}
							Text={"TROLL MENU"}
							TextColor3={Color3.fromRGB(1, 255, 18)}
							TextScaled={true}
							TextStrokeColor3={Color3.fromRGB(255, 0, 4)}
							TextWrapped={true}
						>
							<uistroke key={"UIStroke"} />
						</textlabel>
					</imagebutton>

					<uilistlayout
						key={"UIListLayout"}
						Padding={new UDim(0, 2)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>

					<uicorner key={"UICorner"} CornerRadius={new UDim(0.2, 0)} />

					<imagebutton
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						Image={"rbxassetid://110160194488001"}
						key={"Trip"}
						Size={UDim2.fromScale(1, 0.195)}
						Event={{
							MouseButton1Click: () => {
								if (selectedPlayer === undefined) return;
								MarketplaceService.PromptProductPurchase(Players.LocalPlayer, TrollDevproducts.Trip);
							},
						}}
					>
						<textlabel
							key={"TextLabel"}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundColor3={Color3.fromRGB(255, 255, 255)}
							BackgroundTransparency={1}
							BorderColor3={Color3.fromRGB(0, 0, 0)}
							BorderSizePixel={0}
							FontFace={new Font("rbxasset://fonts/families/Bangers.json")}
							Position={UDim2.fromScale(0, 1)}
							Size={UDim2.fromScale(1, 0.301)}
							Text={"TRIP"}
							TextColor3={Color3.fromRGB(255, 0, 4)}
							TextScaled={true}
							TextStrokeColor3={Color3.fromRGB(255, 0, 4)}
							TextWrapped={true}
						>
							<uistroke key={"UIStroke"} Thickness={2} />
						</textlabel>
					</imagebutton>

					<uipadding key={"UIPadding"} PaddingLeft={new UDim(0.02, 0)} PaddingRight={new UDim(0.02, 0)} />

					<imagebutton
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						Image={"rbxassetid://108050420528842"}
						LayoutOrder={1}
						key={"Fling"}
						Size={UDim2.fromScale(1, 0.195)}
						Event={{
							MouseButton1Click: () => {
								if (selectedPlayer === undefined) return;
								MarketplaceService.PromptProductPurchase(Players.LocalPlayer, TrollDevproducts.Fling);
							},
						}}
					>
						<textlabel
							key={"TextLabel"}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundColor3={Color3.fromRGB(255, 255, 255)}
							BackgroundTransparency={1}
							BorderColor3={Color3.fromRGB(0, 0, 0)}
							BorderSizePixel={0}
							FontFace={new Font("rbxasset://fonts/families/Bangers.json")}
							Position={UDim2.fromScale(0, 1)}
							Size={UDim2.fromScale(1, 0.301)}
							Text={"FLING"}
							TextColor3={Color3.fromRGB(255, 0, 4)}
							TextScaled={true}
							TextStrokeColor3={Color3.fromRGB(255, 0, 4)}
							TextWrapped={true}
						>
							<uistroke key={"UIStroke"} Thickness={2} />
						</textlabel>
					</imagebutton>

					<imagebutton
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						Image={"rbxassetid://108826546737849"}
						LayoutOrder={2}
						key={"Freeze"}
						Size={UDim2.fromScale(1, 0.195)}
						Event={{
							MouseButton1Click: () => {
								if (selectedPlayer === undefined) return;
								MarketplaceService.PromptProductPurchase(Players.LocalPlayer, TrollDevproducts.Freeze);
							},
						}}
					>
						<textlabel
							key={"TextLabel"}
							AnchorPoint={new Vector2(0, 1)}
							BackgroundColor3={Color3.fromRGB(255, 255, 255)}
							BackgroundTransparency={1}
							BorderColor3={Color3.fromRGB(0, 0, 0)}
							BorderSizePixel={0}
							FontFace={new Font("rbxasset://fonts/families/Bangers.json")}
							Position={UDim2.fromScale(0, 1)}
							Size={UDim2.fromScale(1, 0.301)}
							Text={"FREEZE"}
							TextColor3={Color3.fromRGB(255, 0, 4)}
							TextScaled={true}
							TextStrokeColor3={Color3.fromRGB(255, 0, 4)}
							TextWrapped={true}
						>
							<uistroke key={"UIStroke"} Thickness={2} />
						</textlabel>
					</imagebutton>
				</frame>

				<imagebutton
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					Image={"rbxassetid://130536453256413"}
					key={"TrollSad"}
					Position={UDim2.fromScale(-0.716, -0.019)}
					Size={UDim2.fromScale(1.144, 0.261)}
					Visible={!menuOpen}
					Event={{
						MouseButton1Click: () => setMenuOpen(true),
						MouseEnter: () => {
							if (!readyToOpen) return;
							setMenuOpen(true);
						},
					}}
				/>
			</frame>
		</frame>
	);
};
