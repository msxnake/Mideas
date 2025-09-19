cuando pida incrementar version, o diga nueva version, lee archivo ubicado en docs/project/VERSION\_LOCATIONS.md y sigue las instrucciones.

# MSX Memory Map

Direcciones   | Tamaño | Uso típico (MSX1)
--------------+--------+--------------------------
0000h-3FFFh   | 16 KB  | BIOS ROM
4000h-7FFFh   | 16 KB  | BASIC ROM / cartucho
8000h-BFFFh   | 16 KB  | RAM (parte baja)
C000h-FFFFh   | 16 KB  | RAM (parte alta)

## ⚠️ IMPORTANTE: MSX2+ Slot Management

* En MSX2+, la dirección #FFFF es el registro de selección de slots secundarios
* NUNCA escribir en #FFFF durante limpieza de RAM (puede causar crash/reset)
* Al limpiar RAM C000h-FFFFh, usar BC=#3FFE para parar en #FFFE
* Solo afecta MSX2+; MSX1 no tiene este problema



En el código asm para MSX, recordar que no trabajamos en modo texto, siempre trabajamos en screen 2 (graphic), por tanto las rutinas de la bios que 

hacen referencia a modo texto quedan invalidadas.



Siempre compilamos asm con el compilador glass.jar que se encuentra en server.



Nuestro emulador por defecto es Openmsx.

Tenemos un agente que se encarga de las funciones de Openmsx.





El  proyecto que estamos haciondo es un editor de juegos para MSX, se llama "Mideas MSX", compilado .



