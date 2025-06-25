import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import "./Navbar.css";

const pages = ["Home", "Profile"];

export default function Navbar() {
	const [anchorNav, setAnchorNav] = React.useState<null | HTMLElement>(null);
	const [anchorUserMenu, setAnchorUserMenu] =
		React.useState<null | HTMLElement>(null);

	const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorNav(event.currentTarget);
	};
	const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorUserMenu(event.currentTarget);
	};

	const handleCloseNavMenu = () => {
		setAnchorNav(null);
	};

	const handleCloseUserMenu = () => {
		setAnchorUserMenu(null);
	};

	return (
		<AppBar>
			<Toolbar>
				<Box sx={{ display: 'flex', gap: 1 }}>
					{pages.map((page) => (
						<Button
							key={page}
							onClick={handleCloseNavMenu}
							sx={{ my: 2, color: 'white', display: 'block' }}
						>
							{page}
						</Button>
					))}
				</Box>
			</Toolbar>
		</AppBar>
	);
}
