-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema mochimexa
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema mochimexa
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `mochimexa` DEFAULT CHARACTER SET utf8 ;
USE `mochimexa` ;

-- -----------------------------------------------------
-- Table `mochimexa`.`rol`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`rol` (
  `id_rol` INT NOT NULL AUTO_INCREMENT,
  `rol_asignado` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE INDEX `id_mochi_rol_UNIQUE` (`id_rol` ASC) ,
  UNIQUE INDEX `nombre_UNIQUE` (`rol_asignado` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`usuario`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`usuario` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(150) NOT NULL,
  `telefono` VARCHAR(20) NULL,
  `fecha_registro` DATETIME NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  `id_rol` INT NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo_UNIQUE` (`correo` ASC) ,
  INDEX `fk_usuarios_rol_idx` (`id_rol` ASC) ,
  CONSTRAINT `fk_usuarios_rol`
    FOREIGN KEY (`id_rol`)
    REFERENCES `mochimexa`.`rol` (`id_rol`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`categoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`categoria` (
  `id_categoria` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_categoria`),
  UNIQUE INDEX `nombre_UNIQUE` (`nombre` ASC) )
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`producto` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` TEXT(500) BINARY NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL,
  `stock` INT NOT NULL,
  `marca` VARCHAR(100) NULL,
  `activo` TINYINT(1) NOT NULL,
  `id_categoria` INT NOT NULL,
  PRIMARY KEY (`id_producto`),
  INDEX `fk_productos_categoria1_idx` (`id_categoria` ASC) ,
  CONSTRAINT `fk_productos_categoria1`
    FOREIGN KEY (`id_categoria`)
    REFERENCES `mochimexa`.`categoria` (`id_categoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`direccion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`direccion` (
  `id_direccion` INT NOT NULL AUTO_INCREMENT,
  `calle` VARCHAR(100) NOT NULL,
  `numero` VARCHAR(20) NOT NULL,
  `colonia` VARCHAR(100) NOT NULL,
  `codigo_postal` VARCHAR(10) NOT NULL,
  `ciudad` VARCHAR(100) NOT NULL,
  `estado` VARCHAR(100) NOT NULL,
  `referencia` VARCHAR(150) NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_direccion`),
  INDEX `fk_direccion_usuarios1_idx` (`id_usuario` ASC) ,
  CONSTRAINT `fk_direccion_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `mochimexa`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`carrito`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`carrito` (
  `id_carrito` INT NOT NULL AUTO_INCREMENT,
  `fecha_creacion` DATETIME NOT NULL,
  `estado` VARCHAR(20) NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_carrito`),
  INDEX `fk_carrito_usuarios1_idx` (`id_usuario` ASC) ,
  CONSTRAINT `fk_carrito_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `mochimexa`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`carrito_detalle`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`carrito_detalle` (
  `id_carrito_detalle` INT NOT NULL AUTO_INCREMENT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `id_carrito` INT NOT NULL,
  `id_producto` INT NOT NULL,
  PRIMARY KEY (`id_carrito_detalle`),
  INDEX `fk_carrito_detalle_carrito1_idx` (`id_carrito` ASC) ,
  INDEX `fk_carrito_detalle_productos1_idx` (`id_producto` ASC) ,
  CONSTRAINT `fk_carrito_detalle_carrito1`
    FOREIGN KEY (`id_carrito`)
    REFERENCES `mochimexa`.`carrito` (`id_carrito`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_carrito_detalle_productos1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `mochimexa`.`producto` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`pedido`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`pedido` (
  `id_pedido` INT NOT NULL AUTO_INCREMENT,
  `fecha_pedido` DATETIME NOT NULL,
  `estado` VARCHAR(30) NOT NULL,
  `sub_total` DECIMAL(10,2) NOT NULL,
  `costo_envio` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_pedido`),
  INDEX `fk_pedido_usuarios1_idx` (`id_usuario` ASC) ,
  CONSTRAINT `fk_pedido_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `mochimexa`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`pedido_detalle`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`pedido_detalle` (
  `id_pedido_detalle` INT NOT NULL AUTO_INCREMENT,
  `cantidad` INT NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `id_pedido` INT NOT NULL,
  `id_producto` INT NOT NULL,
  PRIMARY KEY (`id_pedido_detalle`),
  INDEX `fk_pedido_detalle_pedido1_idx` (`id_pedido` ASC) ,
  INDEX `fk_pedido_detalle_productos1_idx` (`id_producto` ASC) ,
  CONSTRAINT `fk_pedido_detalle_pedido1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `mochimexa`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_pedido_detalle_productos1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `mochimexa`.`producto` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`metodo_pago`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`metodo_pago` (
  `id_metodo_pago` INT NOT NULL AUTO_INCREMENT,
  `tipo_pago` VARCHAR(30) NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `fecha_pago` DATETIME NULL,
  `estado` VARCHAR(30) NOT NULL,
  `id_pedido` INT NOT NULL,
  PRIMARY KEY (`id_metodo_pago`),
  INDEX `fk_pago_pedido1_idx` (`id_pedido` ASC) ,
  CONSTRAINT `fk_pago_pedido1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `mochimexa`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`envio`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`envio` (
  `id_envio` INT NOT NULL AUTO_INCREMENT,
  `empresa_envio` VARCHAR(100) NULL,
  `numero_guia` VARCHAR(150) NOT NULL,
  `fecha_envio` DATETIME NOT NULL,
  `fecha_entrega` DATETIME NULL,
  `estado` VARCHAR(45) NOT NULL,
  `id_pedido` INT NOT NULL,
  PRIMARY KEY (`id_envio`),
  INDEX `fk_envio_pedido1_idx` (`id_pedido` ASC) ,
  CONSTRAINT `fk_envio_pedido1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `mochimexa`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`resenias`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`resenias` (
  `id_resenias` INT NOT NULL AUTO_INCREMENT,
  `calificacion` INT NOT NULL,
  `comentario` TEXT(500) NULL,
  `fecha` DATETIME NOT NULL,
  `id_usuario` INT NOT NULL,
  `id_producto` INT NOT NULL,
  PRIMARY KEY (`id_resenias`),
  INDEX `fk_resenias_usuarios1_idx` (`id_usuario` ASC) ,
  INDEX `fk_resenias_productos1_idx` (`id_producto` ASC) ,
  CONSTRAINT `fk_resenias_usuarios1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `mochimexa`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_resenias_productos1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `mochimexa`.`producto` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`promociones`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`promociones` (
  `id_promociones` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `descripcion` VARCHAR(300) NOT NULL,
  `tipo_descuento` VARCHAR(45) NOT NULL,
  `valor_descuento` DECIMAL(10,2) NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `activo` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id_promociones`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`producto_promocion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`producto_promocion` (
  `id_producto_promocion` INT NOT NULL AUTO_INCREMENT,
  `id_producto` INT NOT NULL,
  `id_promociones` INT NOT NULL,
  PRIMARY KEY (`id_producto_promocion`),
  INDEX `fk_producto_promocion_productos1_idx` (`id_producto` ASC) ,
  INDEX `fk_producto_promocion_promociones1_idx` (`id_promociones` ASC) ,
  CONSTRAINT `fk_producto_promocion_productos1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `mochimexa`.`producto` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_producto_promocion_promociones1`
    FOREIGN KEY (`id_promociones`)
    REFERENCES `mochimexa`.`promociones` (`id_promociones`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`pedido_direccion`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`pedido_direccion` (
  `id_direccion` INT NOT NULL,
  `id_pedido` INT NOT NULL,
  PRIMARY KEY (`id_direccion`, `id_pedido`),
  INDEX `fk_direccion_has_pedido_pedido1_idx` (`id_pedido` ASC) ,
  INDEX `fk_direccion_has_pedido_direccion1_idx` (`id_direccion` ASC) ,
  CONSTRAINT `fk_direccion_has_pedido_direccion1`
    FOREIGN KEY (`id_direccion`)
    REFERENCES `mochimexa`.`direccion` (`id_direccion`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_direccion_has_pedido_pedido1`
    FOREIGN KEY (`id_pedido`)
    REFERENCES `mochimexa`.`pedido` (`id_pedido`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mochimexa`.`contrasenia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mochimexa`.`contrasenia` (
  `id_contrasenia` INT NOT NULL AUTO_INCREMENT,
  `password_hash` VARCHAR(255) NOT NULL,
  `id_usuario` INT NOT NULL,
  PRIMARY KEY (`id_contrasenia`),
  INDEX `fk_contrasenia_usuario1_idx` (`id_usuario` ASC) ,
  UNIQUE INDEX `id_usuario_UNIQUE` (`id_usuario` ASC) ,
  CONSTRAINT `fk_contrasenia_usuario1`
    FOREIGN KEY (`id_usuario`)
    REFERENCES `mochimexa`.`usuario` (`id_usuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
