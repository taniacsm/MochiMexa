USE mochimexa;

DESCRIBE rol;

INSERT INTO rol(nombre, descripcion)
VALUES 
("Missael", "Administrador"),
("Maribel", "Administrador"),
("Andrea", "Administrador"),
("Tania", "Administrador"),
("Frida", "Administrador"),
("Santiago", "Administrador");


INSERT INTO categoria (nombre, descripcion, activo)
VALUES
('Mochis', 'Dulces japoneses elaborados con masa de arroz', 1),
('Bebidas', 'Bebidas asiáticas de diferentes sabores', 1),
('Galletas', 'Galletas y dulces horneados de origen asiático', 1),
('Gomitas', 'Gomitas asiáticas de diferentes sabores y presentaciones', 1),
('Snacks', 'Botanas saladas y aperitivos asiáticos', 1);

INSERT INTO promociones
(nombre, descripcion, tipo_descuento,
 valor_descuento, fecha_inicio, fecha_fin, activo)
VALUES
('Mochi Mania',
 'Descuento especial en mochis',
 'Porcentaje', 10.00,
 '2026-08-01', '2026-08-31', 1),

('Pocky Lovers',
 'Promocion especial en productos Pocky',
 'Porcentaje', 15.00,
 '2026-08-01', '2026-08-31', 1),

('Bebidas Japonesas',
 'Descuento en bebidas japonesas',
 'Porcentaje', 10.00,
 '2026-08-10', '2026-09-10', 1),

('Dulce Semana',
 'Descuento en gomitas seleccionadas',
 'Porcentaje', 20.00,
 '2026-08-15', '2026-08-22', 1),

('Promo Matcha',
 'Descuento en productos sabor matcha',
 'Porcentaje', 15.00,
 '2026-08-01', '2026-09-01', 1);


INSERT INTO usuario(nombre, apellido, correo, contrasenia, telefono, fecha_registro, activo, id_rol) VALUES
("Sofía", "Mendoza", "sofia.mendoza@email.com", "$0fia#M2026", "+52 55 1234 5678","2026-01-12 18:30:15", 1, 1),
("Carlos", "Ramírez", "carlos.ramirez88@email.com", "C4rlos_R88?", "+52 55 8765 4321", "2026-02-05 18:26:50", 1, 2),
("Ana María", "Delgado", "ana.delgado@email.com", "A!naDelg2026", "+52 55 5555 1234", "2026-03-20 12:56:25", 1, 3),
("Javier", "Ortiz", "javier.ortiz.dev@email.com", "J@v1er_O389", "+52 55 4321 9876", "2026-05-14 14:30:30", 1, 4),
("Valentina", "Morales", "valentina.morales@email.com", "V4l3nt1na!M", "+52 55 9988 7766", "2026-07-02 09:13:01", 1, 5);

INSERT INTO direccion ( id_direccion, calle, numero, colonia, codigo_postal, ciudad, estado, referencia, id_usuario )
 VALUES 
(1, 'Av. Insurgentes Sur', '1520', 'Crédito Constructor', '03940', 'Ciudad de México', 'CDMX', 'Frente al parque, portón negro', 1),
 (2, 'Calle Hidalgo', '45', 'Centro', '50000', 'Toluca', 'Estado de México', 'Casa blanca de dos pisos', 2),
 (3, 'Av. Juárez', '88', 'Juárez', '06600', 'Ciudad de México', 'CDMX', 'Piso 3, departamento 302', 2),
 (4, 'Paseo de la Reforma', '222', 'Juárez', '06600', 'Ciudad de México', 'CDMX', 'Entrar por recepción principal', 3),
 (5, 'Calle Fresno', '12B', 'Santa María la Ribera', '06400', 'Ciudad de México', 'CDMX', 'Junto a la tienda de abarrotes', 4); 

INSERT INTO producto(nombre, descripcion, precio, stock, marca, activo, id_categoria) VALUES
("Mochi de Matcha y fresa", "Pastelito de arroz relleno de crema de matcha suave y centro de mermelada de fresa", 4.50, 100, "Sakura Bites", 1, 1),
("Pocky de Té Verde Matcha", "Galletas en forma de palito cubiertas con suave crema de té verde matcha tradicional", 3.50, 120, "Glico", 1, 2),
("Mochi de Fresca Fresas con Crema", "Pastelitos de arroz glutinoso suave rellenos de mermelada de fresa y crema dulce", 5.99, 45, "Royal Family", 1, 3),
("Ramune Soda Sabor Melon", "Bebida gaseosa tradicional japonesa con la emblemática canica de cristal y aroma a melón dulce", 2.80, 200, "Hata Kosen", 1, 4),
("Pocky Crunchy Strawberry", "Palitos de galleta cubierta con crema de fresa y trozos reales de fresa deshidratada", 3.80, 85, "Glico", 1, 5);

INSERT INTO carrito
(fecha_creacion, estado, id_usuario)
VALUES
('2026-08-17 12:00:00', 'Activo', 1),
('2026-08-17 12:10:00', 'Activo', 2),
('2026-08-17 12:20:00', 'Comprado', 3),
('2026-08-17 12:30:00', 'Activo', 4),
('2026-08-17 12:40:00', 'Comprado', 5);

INSERT INTO pedido
(fecha_pedido, estado, sub_total, costo_envio, total, id_usuario, id_direccion)
VALUES
('2026-08-10 12:30:00', 'Entregado', 250.00, 50.00, 300.00, 1, 1),
('2026-08-11 15:45:00', 'Enviado', 420.00, 50.00, 470.00, 2, 2),
('2026-08-12 10:20:00', 'Pendiente', 180.00, 50.00, 230.00, 3, 3),
('2026-08-13 18:10:00', 'Entregado', 550.00, 0.00, 550.00, 4, 4),
('2026-08-14 13:25:00', 'Procesando', 320.00, 50.00, 370.00, 5, 5);

INSERT INTO producto_promocion
(id_producto, id_promociones)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

INSERT INTO carrito_detalle
(cantidad, precio_unitario, id_carrito, id_producto)
VALUES
(2, 45.00, 1, 1),
(1, 55.00, 2, 2),
(3, 65.00, 3, 3),
(2, 40.00, 4, 4),
(1, 80.00, 5, 5);

INSERT INTO pedido_detalle(cantidad, precio_unitario, subtotal, id_pedido, id_producto) 
VALUES (2, 250.00, 500.00, 1, 1),
 (1, 450.50, 450.50, 2, 2), 
(3, 120.00, 360.00, 3, 3), 
(5, 80.00, 400.00, 4, 4), 
(1, 899.99, 899.99, 5, 5); 

INSERT INTO resenias
(calificacion, comentario, fecha, id_usuario, id_producto)
VALUES
(5, 'Muy rico, me encanto el sabor.',
 '2026-08-21 10:00:00', 1, 1),

(4, 'Muy buen producto y llego bien empacado.',
 '2026-08-21 11:00:00', 2, 2),

(5, 'La bebida esta muy rica y refrescante.',
 '2026-08-22 12:00:00', 3, 3),

(4, 'Las gomitas tienen muy buen sabor.',
 '2026-08-22 13:00:00', 4, 4),

(5, 'El producto de matcha esta delicioso.',
 '2026-08-22 14:00:00', 5, 5);

ALTER TABLE envio
MODIFY fecha_entrega DATETIME NULL;

INSERT INTO envio( id_envio, empresa_envio, numero_guia, fecha_envio, fecha_entrega, estado, id_pedido)
VALUES
(1,'Estafeta','234425','2026-07-21 21:45:15','2026-08-17 18:13:25','Entregado',1),
(2,'DHL','234426','2026-06-18 13:18:55','2026-08-17 17:15:22','Entregado',2),
(3,'DHL','234427','2026-08-16 3:33:32', '2026-08-12 17:15:32' ,'Empaquetando',3),
(4,'Estafeta','234428','2026-06-21 2:13:55','2026-07-31 18:16:42','Entregado',4),
(5,'Estafeta','234429','2026-08-10 17:22:48', '2026-08-21 17:15:28' ,'Empaquetando',5);

INSERT INTO pago 
(metodo_pago, monto, fecha_pago, estado, id_pedido) 
VALUES ('Tarjeta de Crédito', 500.00, '2026-08-10 10:15:00', 'Completado', 1),
('PayPal', 450.50, '2026-08-11 14:30:00', 'Completado', 2), 
('Transferencia', 360.00, '2026-08-12 09:00:00', 'Pendiente', 3),
('Efectivo', 400.00, '2026-08-13 18:20:00', 'Completado', 4), 
('Tarjeta de Débito', 899.99, '2026-08-14 11:45:00', 'Rechazado', 5);