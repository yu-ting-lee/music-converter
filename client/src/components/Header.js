import React from "react";
import { Navbar } from "react-bootstrap";
import Logo from "../logo.svg";

const Header = () => {
  return (
    <Navbar bg="dark" variant="dark" fixed="top">
      <img src={Logo} width="30" height="30" alt="logo" />
      <Navbar.Brand href="/">Music Converter</Navbar.Brand>
    </Navbar>
  );
};

export default Header;
