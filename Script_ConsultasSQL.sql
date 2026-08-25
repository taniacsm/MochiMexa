USE mochimexa;

-- =========================================================
-- 1. ROL
-- =========================================================
INSERT INTO rol (rol_asignado, descripcion)
VALUES
('Admin', 'Administrador del sistema'),
('Usuario', 'Cliente registrado de la tienda'),
('Proveedor', 'Proveedor de productos y mercancía para MochiMexa');

-- =========================================================
-- 2. CATEGORIA
-- =========================================================
INSERT INTO categoria (nombre, descripcion, activo)
VALUES
('Mochis', 'Dulces japoneses elaborados con masa de arroz', 1),
('Bebidas', 'Bebidas asiáticas de diferentes sabores', 1),
('Galletas', 'Galletas y dulces horneados de origen asiático', 1),
('Gomitas', 'Gomitas asiáticas de diferentes sabores y presentaciones', 1),
('Snacks', 'Botanas saladas y aperitivos asiáticos', 1),
('Mochis Helados', 'Mochis rellenos de helado de diferentes sabores', 1),
('Caramelos Macizos', 'Caramelos duros tradicionales y con centro efervescente', 1),
('Bebidas con Gas', 'Refrescos icónicos como Ramune y sodas saborizadas', 1),
('Tés y Infusiones', 'Té verde Matcha, té oolong y embotellados listos para tomar', 1),
('Snacks de Alga', 'Botanas crujientes de alga Nori sazonada', 1),
('Senbei y Galletas de Arroz', 'Botanas tradicionales japonesas horneadas a la parrilla', 1),
('Dulces Ácidos', 'Gomitas y golosinas con coberturas de alto nivel de acidez', 1),
('Postres de Gelatina', 'Gelatinas de frutas reales en empaques individuales', 1),
('Pocky y Pretzel', 'Palitos de galleta horneada cubiertos de diversos sabores', 0),
('Botanas de Marisco', 'Snacks salados a base de calamar, pescado y camarón', 0);

-- =========================================================
-- 3. PROMOCIONES
-- =========================================================
INSERT INTO promociones
(nombre, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, activo)
VALUES
('Mochi Mania', 'Descuento especial en mochis', 'Porcentaje', 10.00, '2026-08-01', '2026-08-31', 1),
('Pocky Lovers', 'Promocion especial en productos Pocky', 'Porcentaje', 15.00, '2026-08-01', '2026-08-31', 1),
('Bebidas Japonesas', 'Descuento en bebidas japonesas', 'Porcentaje', 10.00, '2026-08-10', '2026-09-10', 1),
('Dulce Semana', 'Descuento en gomitas seleccionadas', 'Porcentaje', 20.00, '2026-08-15', '2026-08-22', 1),
('Promo Matcha', 'Descuento en productos sabor matcha', 'Porcentaje', 15.00, '2026-08-01', '2026-09-01', 1),
('Mochi Mania', 'Descuento especial en mochis', 'Porcentaje', 10.00, '2026-08-01', '2026-08-31', 1),
('Pocky Lovers', 'Promocion especial en productos Pocky', 'Porcentaje', 15.00, '2026-08-01', '2026-08-31', 1),
('Bebidas Japonesas', 'Descuento en bebidas japonesas', 'Porcentaje', 10.00, '2026-08-10', '2026-09-10', 1),
('Dulce Semana', 'Descuento en gomitas seleccionadas', 'Porcentaje', 20.00, '2026-08-15', '2026-08-22', 1),
('Promo Matcha', 'Descuento en productos sabor matcha', 'Porcentaje', 15.00, '2026-08-01', '2026-09-01', 1),
('Envio Gratis', 'Descuento directo en costo de envio', 'Fijo', 50.00, '2026-08-01', '2026-08-31', 1),
('Snack Time', 'Descuento en botanas y galletas saladas', 'Porcentaje', 12.00, '2026-08-18', '2026-08-28', 1),
('Kits Popin Cookin', 'Rebaja especial en kits de dulces DIY', 'Porcentaje', 10.00, '2026-08-05', '2026-08-25', 1),
('Ramen Combo', 'Descuento fijo en compra de fideos instantaneos', 'Fijo', 25.00, '2026-08-01', '2026-09-15', 1),
('Bienvenida Mochimexa', 'Descuento de primera compra para usuarios nuevos', 'Porcentaje', 10.00, '2026-08-01', '2026-12-31', 1);

-- =========================================================
-- 4. USUARIO
-- =========================================================
INSERT INTO usuario
(nombre, apellido, correo, telefono, fecha_registro, activo, id_rol)
VALUES
('Sofía', 'Mendoza', 'sofia.mendoza@email.com', '+525512345678', '2026-01-12 18:30:15', 1, 1),
('Carlos', 'Ramírez', 'carlos.ramirez88@email.com', '+525587654321', '2026-02-05 18:26:50', 1, 2),
('Ana María', 'Delgado', 'ana.delgado@email.com', '+525555551234', '2026-03-20 12:56:25', 0, 2),
('Javier', 'Ortiz', 'javier.ortiz.dev@email.com', '+525543219876', '2026-05-14 14:30:30', 1, 2),
('Valentina', 'Morales', 'valentina.morales@email.com', '+525599887766', '2026-07-02 09:13:01', 1, 3),
('Carlos', 'Mendoza', 'carlos.mendoza@email.com', '+525551234567', '2026-08-01 09:00:00', 1, 2),
('Ana', 'García', 'ana.garcia@email.com', '+523339876543', '2026-08-02 10:15:00', 1, 2),
('Luis', 'Hernández', 'luis.hernandez@email.com', '+528114567890', '2026-08-03 11:30:00', 0, 3),
('Sofía', 'López', 'sofia.lopez@email.com', '+529992345678', '2026-08-04 14:20:00', 1, 1),
('Miguel', 'Torres', 'miguel.torres@email.com', '+525558765432', '2026-08-05 16:45:00', 1, 2),
('Elena', 'Martínez', 'elena.martinez@email.com', '+522223456789', '2026-08-06 08:10:00', 0, 2),
('Jorge', 'Ramírez', 'jorge.ramirez@email.com', '+529981234567', '2026-08-07 12:00:00', 1, 3),
('Mariana', 'Sánchez', 'mariana.sanchez@email.com', '+524498765432', '2026-08-08 17:30:00', 1, 2),
('Fernando', 'Gómez', 'fernando.gomez@email.com', '+526642345678', '2026-08-09 13:15:00', 0, 2),
('Valeria', 'Díaz', 'valeria.diaz@email.com', '+524778765432', '2026-08-10 15:50:00', 1, 3);

-- =========================================================
-- 5. DIRECCION
-- =========================================================
INSERT INTO direccion
(calle, numero, colonia, codigo_postal, ciudad, estado, referencia, id_usuario)
VALUES
('Av. Insurgentes Sur', '1520', 'Crédito Constructor', '03940', 'Ciudad de México', 'CDMX', 'Frente al parque, portón negro', 1),
('Calle Hidalgo', '45', 'Centro', '50000', 'Toluca', 'Estado de México', 'Casa blanca de dos pisos', 2),
('Av. Juárez', '88', 'Juárez', '06600', 'Ciudad de México', 'CDMX', 'Piso 3, departamento 302', 2),
('Paseo de la Reforma', '222', 'Juárez', '06600', 'Ciudad de México', 'CDMX', 'Entrar por recepción principal', 3),
('Calle Fresno', '12B', 'Santa María la Ribera', '06400', 'Ciudad de México', 'CDMX', 'Junto a la tienda de abarrotes', 4),
('Av. Insurgentes Sur', '1234', 'Del Valle', '03100', 'Ciudad de México', 'CDMX', 'Frente al parque, portón blanco', 6),
('Calle Hidalgo', '45-A', 'Centro Histórico', '44100', 'Guadalajara', 'Jalisco', 'Entre Morelos y Juárez, local comercial', 7),
('Av. Constitución', '890', 'Obrera', '64000', 'Monterrey', 'Nuevo León', 'Edificio azul, departamento 302', 8),
('Calle 60', '502', 'Centro', '97000', 'Mérida', 'Yucatán', 'Junto a la tienda de conveniencia', 9),
('Av. Reforma', '78', 'Juárez', '06600', 'Ciudad de México', 'CDMX', 'Torre de departamentos, timbre 4B', 10),
('Calle 5 de Mayo', '12', 'Puebla Centro', '72000', 'Puebla', 'Puebla', 'Casa de dos pisos con fachada roja', 11),
('Blvd. Kukulcán', 'Km 9.5', 'Zona Hotelera', '77500', 'Cancún', 'Quintana Roo', 'Recepción de los condominios', 12),
('Av. Universidad', '405', 'Bosques del Valle', '20127', 'Aguascalientes', 'Aguascalientes', 'Portón negro, dejar con guardia', 13),
('Calle Zaragoza', '231', 'Moderna', '22000', 'Tijuana', 'Baja California', 'Esquina con Revolución', 14),
('Av. Juárez', '610', 'Centro', '37000', 'León', 'Guanajuato', 'Plaza comercial, segundo piso', 15);

-- =========================================================
-- 6. PRODUCTO
-- =========================================================
INSERT INTO producto
(nombre, descripcion, precio, stock, marca, activo, id_categoria)
VALUES
('Mochi de Matcha y fresa', 'Pastelito de arroz relleno de crema de matcha suave y centro de mermelada de fresa', 4.50, 100, 'Sakura Bites', 1, 1),
('Pocky de Té Verde Matcha', 'Galletas en forma de palito cubiertas con suave crema de té verde matcha tradicional', 3.50, 120, 'Glico', 1, 3),
('Mochi de Fresca Fresas con Crema', 'Pastelitos de arroz glutinoso suave rellenos de mermelada de fresa y crema dulce', 5.99, 45, 'Royal Family', 1, 1),
('Ramune Soda Sabor Melon', 'Bebida gaseosa tradicional japonesa con la emblemática canica de cristal y aroma a melón dulce', 2.80, 200, 'Hata Kosen', 1, 2),
('Pocky Crunchy Strawberry', 'Palitos de galleta cubierta con crema de fresa y trozos reales de fresa deshidratada', 3.80, 85, 'Glico', 1, 3),
('Mochi de Té Verde Matcha', 'Pasteles de arroz rellenos de crema de matcha tradicional', 85.00, 50, 'Royal Family', 1, 1),
('Ramune Sabor Original', 'Refresco icónico japonés en botella de vidrio con canica', 45.00, 100, 'Kimura', 1, 8),
('Pocky Sabor Matcha', 'Palitos de galleta horneada cubiertos de chocolate con té verde', 38.00, 120, 'Glico', 1, 14),
('Gomitas Pure Sabor Limón', 'Gomitas masticables ácidas con jugo de fruta natural y vitamina C', 32.00, 80, 'Kanro', 1, 12),
('Senbei de Salsa de Soya', 'Galletas de arroz crujientes sazonadas con salsa de soya', 42.00, 60, 'Sanko', 1, 11),
('KitKat Sabor Té Verde Matcha', 'Barra de wáfer cubierta de chocolate blanco con infusión de matcha', 55.00, 90, 'Nestlé Japan', 1, 5),
('Nissin Cup Noodles Seafood', 'Sopa instantánea de fideos con sabor a mariscos y vegetales', 48.00, 75, 'Nissin', 1, 15),
('Popin Cookin Donas DIY', 'Kit de dulces interactivo para crear mini donas comestibles', 95.00, 30, 'Kracie', 1, 5),
('Dorayaki Relleno de Anko', 'Bizcocho esponjoso relleno de pasta dulce de judía roja', 40.00, 45, 'Maruto', 0, 3),
('Hi-Chew Sabor Mango', 'Dulces masticables suaves de textura intensa sabor mango', 28.00, 150, 'Morinaga', 0, 7);

-- =========================================================
-- 7. CARRITO
-- =========================================================
INSERT INTO carrito (fecha_creacion, estado, id_usuario)
VALUES
('2026-08-17 12:00:00', 'Activo', 1),
('2026-08-17 12:10:00', 'Activo', 2),
('2026-08-17 12:20:00', 'Comprado', 3),
('2026-08-17 12:30:00', 'Activo', 4),
('2026-08-17 12:40:00', 'Comprado', 5),
('2026-08-15 10:30:00', 'Activo', 6),
('2026-08-16 11:15:00', 'Activo', 7),
('2026-08-17 14:20:00', 'Procesado', 8),
('2026-08-18 09:45:00', 'Abandonado', 9),
('2026-08-18 16:10:00', 'Activo', 10),
('2026-08-19 12:00:00', 'Procesado', 11),
('2026-08-19 18:30:00', 'Activo', 12),
('2026-08-20 08:15:00', 'Abandonado', 13),
('2026-08-20 15:50:00', 'Procesado', 14),
('2026-08-21 09:10:00', 'Activo', 15);

-- =========================================================
-- 8. CARRITO_DETALLE
-- =========================================================
INSERT INTO carrito_detalle (cantidad, precio_unitario, id_carrito, id_producto)
VALUES
(2, 45.00, 1, 1),
(1, 55.00, 2, 2),
(3, 65.00, 3, 3),
(2, 40.00, 4, 4),
(1, 80.00, 5, 5),
(2, 85.00, 6, 6),
(1, 45.00, 7, 7),
(3, 38.00, 8, 8),
(1, 32.00, 9, 9),
(5, 42.00, 10, 10),
(2, 55.00, 11, 11),
(1, 48.00, 12, 12),
(4, 95.00, 13, 13),
(2, 40.00, 14, 14),
(1, 28.00, 15, 15);

-- =========================================================
-- 9. PEDIDO
-- =========================================================
INSERT INTO pedido (fecha_pedido, estado, sub_total, costo_envio, total, id_usuario)
VALUES
('2026-08-10 12:30:00', 'Entregado', 250.00, 50.00, 300.00, 1),
('2026-08-11 15:45:00', 'Enviado', 420.00, 50.00, 470.00, 2),
('2026-08-12 10:20:00', 'Pendiente', 180.00, 50.00, 230.00, 3),
('2026-08-13 18:10:00', 'Entregado', 550.00, 0.00, 550.00, 4),
('2026-08-14 13:25:00', 'Procesando', 320.00, 50.00, 370.00, 5),
('2026-08-21 10:00:00', 'Entregado', 250.00, 50.00, 300.00, 6),
('2026-08-21 11:30:00', 'Enviado', 180.00, 50.00, 230.00, 7),
('2026-08-20 15:45:00', 'Procesando', 400.00, 0.00, 400.00, 8),
('2026-08-20 18:20:00', 'Entregado', 320.00, 50.00, 370.00, 9),
('2026-08-19 09:15:00', 'Pendiente', 150.00, 50.00, 200.00, 10),
('2026-08-19 14:00:00', 'Cancelado', 280.00, 50.00, 330.00, 11),
('2026-08-18 10:30:00', 'Entregado', 500.00, 0.00, 500.00, 12),
('2026-08-18 16:45:00', 'Enviado', 210.00, 50.00, 260.00, 13),
('2026-08-17 11:00:00', 'Entregado', 350.00, 50.00, 400.00, 14),
('2026-08-17 13:20:00', 'Entregado', 190.00, 50.00, 240.00, 15);

-- =========================================================
-- 10. PEDIDO_DIRECCION (tabla nueva)
-- =========================================================
INSERT INTO pedido_direccion (id_pedido, id_direccion)
VALUES
(1, 1),
(1, 2),
(2, 2),
(2, 3),
(3, 4),
(4, 5),
(5, 5),
(6, 6),
(7, 7),
(7, 8),
(8, 8),
(9, 9),
(10, 10),
(10, 11),
(11, 11),
(12, 12),
(13, 13),
(14, 14),
(15, 15);

-- =========================================================
-- 11. PEDIDO_DETALLE
-- =========================================================
INSERT INTO pedido_detalle (cantidad, precio_unitario, subtotal, id_pedido, id_producto)
VALUES
(2, 250.00, 500.00, 1, 1),
(1, 450.50, 450.50, 2, 2),
(3, 120.00, 360.00, 3, 3),
(5, 80.00, 400.00, 4, 4),
(1, 899.99, 899.99, 5, 5),
(2, 85.00, 170.00, 6, 6),
(1, 45.00, 45.00, 7, 7),
(3, 38.00, 114.00, 8, 8),
(2, 55.00, 110.00, 9, 9),
(5, 28.00, 140.00, 10, 10),
(1, 95.00, 95.00, 11, 11),
(2, 48.00, 96.00, 12, 12),
(4, 32.00, 128.00, 13, 13),
(1, 42.00, 42.00, 14, 14),
(2, 40.00, 80.00, 15, 15);

-- =========================================================
-- 12. METODO_PAGO
-- =========================================================
INSERT INTO metodo_pago (tipo_pago, monto, fecha_pago, estado, id_pedido)
VALUES
('Tarjeta de Crédito', 500.00, '2026-08-10 10:15:00', 'Completado', 1),
('PayPal', 450.50, '2026-08-11 14:30:00', 'Completado', 2),
('Transferencia', 360.00, '2026-08-12 09:00:00', 'Pendiente', 3),
('Efectivo', 400.00, '2026-08-13 18:20:00', 'Completado', 4),
('Tarjeta de Débito', 899.99, '2026-08-14 11:45:00', 'Rechazado', 5),
('Tarjeta de Crédito', 300.00, '2026-08-21 10:05:00', 'Completado', 6),
('Tarjeta de Débito', 230.00, '2026-08-21 11:32:00', 'Completado', 7),
('PayPal', 400.00, '2026-08-20 15:46:00', 'Completado', 8),
('Efectivo (OXXO)', 370.00, '2026-08-20 19:10:00', 'Completado', 9),
('Transferencia', 200.00, '2026-08-19 09:20:00', 'Completado', 10),
('Tarjeta de Crédito', 330.00, NULL, 'Reembolsado', 11),
('PayPal', 500.00, '2026-08-18 10:31:00', 'Completado', 12),
('Tarjeta de Débito', 260.00, '2026-08-18 16:47:00', 'Completado', 13),
('Transferencia', 400.00, '2026-08-17 11:05:00', 'Completado', 14),
('Efectivo (OXXO)', 240.00, '2026-08-17 14:00:00', 'Completado', 15);

-- =========================================================
-- 13. ENVIO
-- =========================================================
ALTER TABLE envio MODIFY fecha_entrega DATETIME NULL;

INSERT INTO envio (empresa_envio, numero_guia, fecha_envio, fecha_entrega, estado, id_pedido)
VALUES
('Estafeta', '234425', '2026-07-21 21:45:15', '2026-08-17 18:13:25', 'Entregado', 1),
('DHL', '234426', '2026-06-18 13:18:55', '2026-08-17 17:15:22', 'Entregado', 2),
('DHL', '234427', '2026-08-16 03:33:32', NULL, 'Empaquetando', 3),
('Estafeta', '234428', '2026-06-21 02:13:55', '2026-07-31 18:16:42', 'Entregado', 4),
('Estafeta', '234429', '2026-08-10 17:22:48', NULL, 'Empaquetando', 5),
('DHL Express', 'MX-DHL-98432101', '2026-08-21 12:00:00', '2026-08-23 15:30:00', 'Entregado', 6),
('FedEx', 'MX-FDX-54123987', '2026-08-21 14:00:00', '2026-08-24 11:00:00', 'En tránsito', 7),
('Estafeta', 'MX-EST-12983476', '2026-08-21 09:30:00', '2026-08-23 18:00:00', 'En tránsito', 8),
('Redpack', 'MX-RED-87654321', '2026-08-20 20:00:00', '2026-08-22 14:15:00', 'Entregado', 9),
('DHL Express', 'MX-DHL-45678912', '2026-08-19 11:00:00', '2026-08-21 10:45:00', 'Entregado', 10),
(NULL, 'CANCELADO-PEDIDO-6', '2026-08-19 14:00:00', '2026-08-19 14:00:00', 'Cancelado', 11),
('FedEx', 'MX-FDX-32165498', '2026-08-18 12:30:00', '2026-08-20 16:20:00', 'Entregado', 12),
('Estafeta', 'MX-EST-78945612', '2026-08-18 18:00:00', '2026-08-22 13:00:00', 'En tránsito', 13),
('DHL Express', 'MX-DHL-65498732', '2026-08-17 13:00:00', '2026-08-19 12:10:00', 'Entregado', 14),
('Redpack', 'MX-RED-14725836', '2026-08-17 16:00:00', '2026-08-19 17:00:00', 'Entregado', 15);

-- =========================================================
-- 14. RESENIAS
-- =========================================================
INSERT INTO resenias (calificacion, comentario, fecha, id_usuario, id_producto)
VALUES
(5, 'Muy rico, me encanto el sabor.', '2026-08-21 10:00:00', 1, 1),
(4, 'Muy buen producto y llego bien empacado.', '2026-08-21 11:00:00', 2, 2),
(5, 'La bebida esta muy rica y refrescante.', '2026-08-22 12:00:00', 3, 3),
(4, 'Las gomitas tienen muy buen sabor.', '2026-08-22 13:00:00', 4, 4),
(5, 'El producto de matcha esta delicioso.', '2026-08-22 14:00:00', 5, 5),
(5, 'El mochi de té verde tiene una textura súper suave y el relleno sabe delicioso.', '2026-08-21 11:00:00', 6, 6),
(4, 'El Ramune llegó en perfecto estado y bien frío. Muy refrescante.', '2026-08-21 12:30:00', 7, 7),
(5, 'Los Pocky de matcha son mis favoritos, siempre pido varias cajas.', '2026-08-20 16:15:00', 8, 8),
(5, 'Súper crujientes y con un toque de soya perfecto. 100% recomendados.', '2026-08-20 19:40:00', 9, 9),
(4, 'Buen sabor, aunque me gustarían empaques más grandes.', '2026-08-19 10:10:00', 10, 10),
(5, 'El KitKat de matcha es único, nada que ver con los comerciales.', '2026-08-18 11:20:00', 11, 11),
(3, 'Están ricas las gomitas pero un poco más ácidas de lo que esperaba.', '2026-08-18 17:00:00', 12, 12),
(5, 'Llegó rapidísimo a Tijuana y la sopa instantánea estuvo genial.', '2026-08-17 12:45:00', 13, 13),
(4, 'El Dorayaki estaba bastante fresco y esponjoso.', '2026-08-17 15:30:00', 14, 14),
(5, 'Los Hi-Chew de mango tienen un sabor a fruta muy concentrado.', '2026-08-16 14:10:00', 15, 15);

-- =========================================================
-- 15. PRODUCTO_PROMOCION
-- =========================================================
INSERT INTO producto_promocion (id_producto, id_promociones)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9),
(10, 10),
(11, 11),
(12, 12),
(13, 13),
(14, 14),
(15, 15);