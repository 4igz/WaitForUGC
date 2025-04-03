import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";
import { MarketplaceService, Players } from "@rbxts/services";
import { usePx } from "client/hooks/usePx";
import { springs } from "client/utils/springs";

export const NukeAllButton = () => {
	const [hovering, setHovering] = React.useState(false);
	const [size, sizeMotion] = useMotion(UDim2.fromScale(0.0776, 0.187));

	const px = usePx();

	useEffect(() => {
		if (hovering) {
			sizeMotion.spring(UDim2.fromScale(0.085, 0.25), springs.bubbly);
		} else {
			sizeMotion.spring(UDim2.fromScale(0.0776, 0.187), springs.bubbly);
		}
	}, [hovering]);

	return (
		<frame
			BackgroundColor3={Color3.fromRGB(0, 171, 171)}
			BorderColor3={Color3.fromRGB(0, 0, 0)}
			BorderSizePixel={0}
			key={"NukeAll"}
			Position={UDim2.fromScale(0.05, 0.334)}
			Size={size}
			AnchorPoint={new Vector2(0.5, 0.5)}
		>
			<uicorner key={"UICorner"} CornerRadius={new UDim(1, 20)} />

			<uistroke key={"UIStroke"} Thickness={2.8} Transparency={0.45} />

			<imagebutton
				key={"ImageButton"}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(0, 0, 0)}
				BorderSizePixel={0}
				Image={"rbxassetid://134905828938502"}
				Selectable={true}
				Active={true}
				Size={UDim2.fromScale(1, 1)}
				AutoButtonColor={true}
				ZIndex={1}
				Event={{
					MouseButton1Click: () => {
						MarketplaceService.PromptProductPurchase(Players.LocalPlayer, 3237619593);
					},
					MouseEnter: () => setHovering(true),
					MouseLeave: () => setHovering(false),
				}}
			>
				<uicorner key={"UICorner"} CornerRadius={new UDim(1, 20)} />

				<imagelabel
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					Image={"rbxassetid://85869547685150"}
					key={"ImageButton"}
					Position={UDim2.fromScale(0.5, 0.5)}
					AnchorPoint={new Vector2(0.5, 0.5)}
					Active={false}
					Size={UDim2.fromScale(0.9, 0.9)}
					ZIndex={2}
				>
					<uicorner key={"UICorner"} CornerRadius={new UDim(1, 20)} />
				</imagelabel>

				<textlabel
					key={"TextLabel"}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					FontFace={new Font("rbxasset://fonts/families/LuckiestGuy.json")}
					Position={UDim2.fromScale(0, 0.75)}
					Size={UDim2.fromScale(1, 0.32)}
					Text={"☢️NUKE ALL☢️"}
					TextSize={px(24)}
					TextColor3={Color3.fromRGB(255, 238, 5)}
					TextScaled={false}
					ZIndex={3}
				>
					<uistroke key={"UIStroke"} Thickness={2} />
				</textlabel>
			</imagebutton>

			<uiaspectratioconstraint />
		</frame>
	);
};
