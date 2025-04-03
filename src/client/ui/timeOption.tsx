import { useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";
import { Events } from "client/network";
import { springs } from "client/utils/springs";

const convertTime = (seconds: number) => {
	seconds = math.abs(seconds);
	const units = [
		{ label: "month", seconds: 2592000 },
		{ label: "day", seconds: 86400 },
		{ label: "hour", seconds: 3600 },
		{ label: "minute", seconds: 60 },
		{ label: "second", seconds: 1 },
	];

	const result = units
		.map(({ label, seconds: unitSeconds }) => {
			const value = math.floor(seconds / unitSeconds);
			seconds %= unitSeconds;
			return value > 0 ? `${value} ${label}${value > 1 ? "s" : ""}` : "";
		})
		.filter((str) => str !== "")
		.join(", ");

	return result ?? "0 seconds";
};

interface TimeButtonProps {
	imageId: string;
	position?: UDim2;
	anchorPoint?: Vector2;
	onclick: () => void;
	time: number;
	imageAspectRatio?: number;
}

export function TimeButton({
	time,
	imageAspectRatio,
	onclick,
	imageId,
	position = UDim2.fromScale(0, 0),
	anchorPoint = new Vector2(0, 0),
}: TimeButtonProps) {
	// Determine colors based on whether it's positive or negative
	const primaryColor =
		time < 0
			? Color3.fromRGB(239, 0, 4) // Red for positive
			: Color3.fromRGB(28, 232, 14); // Green for negative

	const strokeColor =
		time < 0
			? Color3.fromRGB(168, 0, 3) // Darker red for positive
			: Color3.fromRGB(18, 148, 9); // Darker green for negative

	const deepStrokeColor =
		time < 0
			? Color3.fromRGB(141, 0, 5) // Even darker red for positive
			: Color3.fromRGB(18, 148, 9); // Same green for negative

	const costTextColor = Color3.fromRGB(28, 232, 14);
	const costStrokeColor = Color3.fromRGB(18, 148, 9);

	const [hovering, setHovering] = React.useState(false);
	const [rotation, rotationMotion] = useMotion(0);
	const [size, sizeMotion] = useMotion(UDim2.fromScale(1, 1));

	useEffect(() => {
		sizeMotion.spring(hovering ? UDim2.fromScale(1.05, 1.05) : UDim2.fromScale(1, 1), springs.bubbly);
		rotationMotion.spring(hovering ? math.random(-15, 15) : 0, springs.bubbly);
	});

	return (
		<imagebutton
			AnchorPoint={anchorPoint}
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BackgroundTransparency={1}
			BorderColor3={Color3.fromRGB(0, 0, 0)}
			BorderSizePixel={0}
			key={time > 0 ? "+ImageButton" : "-ImageButton"}
			Position={position}
			Size={UDim2.fromScale(0.503, 0.813)}
			Event={{
				MouseButton1Click: () => {
					Events.timeOptionResponse(-time);
					onclick();
				},
				MouseEnter: () => setHovering(true),
				MouseLeave: () => setHovering(false),
			}}
		>
			<uiaspectratioconstraint key={"UIAspectRatioConstraint"} />

			{/* Hour text label */}
			<textlabel
				key={"HourTextLabel"}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(0, 0, 0)}
				BorderSizePixel={0}
				FontFace={new Font("rbxasset://fonts/families/SourceSansPro.json")}
				Position={UDim2.fromScale(0, 1)}
				Size={UDim2.fromScale(1, time > 0 ? 0.15 : 0.177)}
				Text={`${time > 0 ? "-" : "+"}${convertTime(time)}`}
				TextColor3={primaryColor}
				TextScaled={true}
				TextWrapped={true}
				Visible={time > 0}
			>
				<uistroke key={"UIStroke"} Color={strokeColor} />
				<textlabel
					key={"ShadowTextLabel"}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					FontFace={new Font("rbxasset://fonts/families/SourceSansPro.json")}
					Position={UDim2.fromScale(0, time > 0 ? -0.03 : -0.025)}
					Size={UDim2.fromScale(1, 1)}
					Text={`${time > 0 ? "-" : "+"}${convertTime(time)}`}
					TextColor3={primaryColor}
					TextScaled={true}
					TextWrapped={true}
				>
					<uistroke key={"UIStroke"} Color={deepStrokeColor} />
				</textlabel>
			</textlabel>

			{time < 0 && (
				<textlabel
					key={"CostTextLabel"}
					BackgroundColor3={Color3.fromRGB(255, 255, 255)}
					BackgroundTransparency={1}
					BorderColor3={Color3.fromRGB(0, 0, 0)}
					BorderSizePixel={0}
					FontFace={new Font("rbxasset://fonts/families/SourceSansPro.json")}
					Position={UDim2.fromScale(0, 1)}
					Size={UDim2.fromScale(1, 0.15)}
					Text={`+$${math.floor(math.abs(time) / 10)}`}
					TextColor3={costTextColor}
					TextScaled={true}
					TextWrapped={true}
				>
					<uistroke key={"UIStroke"} Color={costStrokeColor} />
					<textlabel
						key={"ShadowCostTextLabel"}
						BackgroundColor3={Color3.fromRGB(255, 255, 255)}
						BackgroundTransparency={1}
						BorderColor3={Color3.fromRGB(0, 0, 0)}
						BorderSizePixel={0}
						FontFace={new Font("rbxasset://fonts/families/SourceSansPro.json")}
						Position={UDim2.fromScale(0, -0.02)}
						Size={UDim2.fromScale(1, 1)}
						Text={`+$${math.floor(math.abs(time) / 10)}`}
						TextColor3={costTextColor}
						TextScaled={true}
						TextWrapped={true}
					>
						<uistroke key={"UIStroke"} Color={costStrokeColor} />
					</textlabel>
				</textlabel>
			)}

			{/* Image */}
			<imagelabel
				key={"ImageLabel"}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(0, 0, 0)}
				BorderSizePixel={0}
				Image={imageId}
				Size={size}
				Rotation={rotation}
				Position={UDim2.fromScale(0.5, 0.5)}
				AnchorPoint={new Vector2(0.5, 0.5)}
			>
				<uiaspectratioconstraint key={"UIAspectRatioConstraint"} AspectRatio={imageAspectRatio ?? 1} />
			</imagelabel>
		</imagebutton>
	);
}
export const TimeOption = () => {
	const [time, setTime] = React.useState(0);
	const [visible, setVisible] = React.useState(false);

	useEffect(() => {
		Events.displayTimeOption.connect((time) => {
			setTime(time);
			setVisible(true);
		});
	}, []);

	return (
		<frame
			key={"Frame"}
			AnchorPoint={new Vector2(0.5, 0.5)}
			BackgroundColor3={Color3.fromRGB(255, 255, 255)}
			BorderColor3={Color3.fromRGB(0, 0, 0)}
			BorderSizePixel={0}
			ClipsDescendants={true}
			Position={UDim2.fromScale(0.461, 0.5)}
			Size={UDim2.fromScale(0.348, 0.576)}
			Visible={visible}
		>
			<uicorner key={"UICorner"} CornerRadius={new UDim(0.1, 0)} />

			<TimeButton
				imageId="rbxassetid://83882767590126"
				position={UDim2.fromScale(3.97e-8, 0)}
				time={time}
				onclick={() => setVisible(false)}
			/>

			<TimeButton
				imageId="rbxassetid://119692743463725"
				position={UDim2.fromScale(1, 0)}
				anchorPoint={new Vector2(1, 0)}
				time={-time}
				onclick={() => setVisible(false)}
				imageAspectRatio={1.33}
			/>

			<uipadding
				key={"UIPadding"}
				PaddingBottom={new UDim(0.05, 0)}
				PaddingTop={new UDim(0.05, 0)}
				PaddingRight={new UDim(0.01, 0)}
			/>

			<uistroke key={"UIStroke"} Thickness={3} />

			<uiaspectratioconstraint key={"UIAspectRatioConstraint"} AspectRatio={1.46} />
		</frame>
	);
};
