# SCREEN 5: movimientos de enemigos mediante Konami table

En el editor de una sala SCREEN 5, selecciona un enemigo hardware. En **Ruta de
patrulla > Movimiento por asset Konami table**, selecciona un Boss Path cuyo
modo sea **One sprite entry per frame (Konami table)**. El asset sustituye su
movimiento habitual; al quitarlo vuelve a utilizar la configuración anterior.
Las torretas y los objetos transportables usan motores distintos.

En el editor del path:

- **Capa 1 · Forma del recorrido** define rectas, senos y splines.
- **Capa 2 · Ritmo del movimiento > Curva de tiempo y distancia** remuestrea
  esa geometría por longitud recorrida. El eje horizontal es tiempo y el vertical
  distancia acumulada, ambos en porcentaje. Una pendiente mayor da más velocidad;
  un intervalo horizontal produce una pausa. Se pueden añadir, arrastrar, dividir
  y eliminar puntos, o ajustar sus porcentajes con los campos numéricos.
  Cada punto define la fórmula hasta el siguiente. Se ofrecen nueve perfiles:
  constante (`t`), cuadráticos (`t²`, `1−(1−t)²`), cúbicos (`t³`,
  `1−(1−t)³`), seno de entrada (`1−cos(πt/2)`), salida (`sin(πt/2)`),
  entrada/salida (`(1−cos(πt))/2`) y smoothstep (`3t²−2t³`).
  Estas son funciones de avance, no fórmulas de aceleración directa.
  **Intensidad del intervalo completo (×)** se aplica a todas las fórmulas
  entre los nodos geométricos elegidos, independientemente del punto temporal seleccionado: 0 a 4, con precisión de 0,001. ×1 conserva exactamente la
  fórmula original; ×0 interpola linealmente entre esos puntos; ×0,8 suaviza
  y ×1,2 acentúa el contraste. Mantiene la duración y distancia de cada intervalo,
  los puntos temporales y las pausas. No cambia una fórmula constante. El factor
  no desplaza nodos geométricos ni representa un multiplicador de velocidad global.
  Se integra la velocidad no negativa elevada al factor y se normaliza su área.
  Se guarda una sola intensidad en la capa temporal. Los datos de la versión
  anterior se migran usando la intensidad del primer punto si falta la global.
  Los polinomios tienen solución directa; seno y smoothstep usan integración
  numérica precalculada en el editor. Cambiar intensidades puede cambiar las
  pendientes en las uniones; la continuidad de velocidad no se reajusta sola.
  El nodo seleccionado es el inicio. **Desde nodo N hasta** permite elegir otro
  nodo posterior, aunque haya nodos intermedios. Toda la geometría del intervalo
  comparte una duración y una curva de avance: los nodos interiores no reinician
  el reloj. En un loop se puede incluir el cierre hacia el nodo 1; no se admiten
  intervalos que crucen ese cierre y continúen por otra vuelta.
  Los tramos interiores muestran quién controla su ritmo; sus formas siguen
  editándose por separado. Si ya tenían curvas temporales, se conservan pero
  quedan subordinadas al intervalo exterior (el baker lo advierte). Al reducir
  o quitar el intervalo exterior vuelven a estar disponibles. Los extremos se
  guardan por ID; si se elimina el destino, el baker advierte y usa el siguiente
  nodo. Las acciones interiores se ejecutan una vez, en el primer frame que
  alcanza o supera su distancia: Wait mantiene esa posición y añade frames
  fuera del reloj de movimiento; SetSpeed no altera una curva temporal activa.
  La duración establece entre 1 y 3600 transiciones por tramo; el origen de un
  path añade una entrada inicial y las acciones Wait añaden sus propias entradas.
  El preset **Acelerar · mantener · frenar** enlaza sus tres intervalos con
  continuidad de velocidad antes del redondeo a píxeles. En curvas editadas
  libremente hay que ajustar las pendientes de las uniones para conservarla.
  Se admiten hasta 64 puntos, sin retroceso de distancia; un tramo horizontal
  permite detenerse. Cambiar la forma conserva esta capa temporal.
  El concepto de función que transforma progreso temporal en progreso de salida
  está descrito en [W3C CSS Easing Functions](https://www.w3.org/TR/css-easing-1/).
- **Start spacing / End spacing (px/frame)** controlan la separación de las
  posiciones en cada tramo. Por ejemplo, 1 -> 8 acelera; 8 -> 1 frena.
  Se interpola la velocidad por distancia recorrida sobre la curva, no por
  distancia recta entre nodos. No es una aceleración constante en px/frame².
  Vacío hereda la velocidad general; el final vacío hereda el inicio del tramo.
  Son el método alternativo: mientras hay curva temporal, esta tiene prioridad.
- **Edit frame positions** permite arrastrar los puntos azules individualmente.
  Los puntos amarillos tienen posiciones manuales. Cambiar una posición no
  cambia el número de frames. **Reset frame edits** elimina esos ajustes.
  Los ajustes se guardan por número de frame: tras cambiar geometría o tiempos,
  hay que revisarlos o reiniciarlos.
- **Play path (60 Hz)** y el deslizador muestran un marcador de 16x16 recorriendo
  exactamente las posiciones exportadas. No representan los gráficos concretos
  de un enemigo.

La velocidad se calcula al exportar, como separación entre posiciones, siguiendo
la idea del capítulo 10, sección 6 del documento
`re/gradius/Arquitectura_Konami_Gradius_MSX.pdf`. No se evalúan senos ni
aceleraciones en el Z80. El formato se adapta al consumidor SCREEN 5: este usa
X/Y de la tabla y conserva los patrones, animación y colores por línea del
enemigo. Las acciones `Fire` provocan un error de exportación; `SetAnimFrame`
no cambia la animación propia del enemigo. `Wait` genera posiciones repetidas.

Las coordenadas son absolutas del área jugable, sin los 20 píxeles de HUD.
Cada frame de vídeo consume una entrada, independientemente de la cadencia de
lógica del enemigo. En máquinas de 50 Hz durará más que el preview de 60 Hz.
`loop` vuelve al inicio; `once` mantiene la última posición. La pausa del juego
detiene el lector. Entrar de nuevo en la sala reinicia sus punteros. Las capas
adicionales copian la posición del líder con sus offsets habituales.

## Contrato del runtime

Las tablas se comparten por ID entre enemigos y permanecen en ROM residente:
4 bytes por frame, más descriptores de sala. No se cambian bancos al leerlas.
El presupuesto de ROM residente sigue aplicándose; los paths largos pueden
superarlo aunque quede espacio en otros bancos.

Solo los proyectos que usan tablas añaden 8 bytes por slot: puntero actual,
inicio, final y reinicio. El stride común propaga esta ampliación a los otros
sistemas de enemigos. Los proyectos sin tablas no emiten el lector ni esos bytes.

`bitmap_enemy_konami_step`: entrada IX = slot; salida carry = la tabla controla
el movimiento. Preserva BC, HL, IX e IY; modifica AF/DE. No toca VDP, mapper ni
IRQ. Todos los push/pop están equilibrados, incluido el retorno sin tabla.
El código de carga conserva el contrato de `bitmap_load_enemies`.

## Verificación

`node scripts/check_msx2_konami_enemy_paths.mjs` comprueba las nueve fórmulas,
duración exacta, pausas, persistencia JSON, independencia de geometría y ritmo, espaciado variable,
subpíxeles, edición manual, conservación de forma, aislamiento del modo delta,
RAM y generación de bucles/once. `npm run test:msx2-boss-path-fixed-table`
comprueba el contrato existente del baker.

Con Vite en el puerto 5199 (o `MIDEAS_UI_URL`), ejecutar
`node scripts/check_msx2_konami_paths_ui.cjs` valida los controles en navegador.

Prueba de integración realizada: ROM Konami SCC compilada con Glass desde el
generador moderno, enemigo de dos capas, tabla sinusoidal con espaciado 1 -> 8
y regreso 8 -> 1. OpenMSX comprobó 240 frames contra las posiciones de la tabla:
0 discrepancias. La inspección por TypeScript de las entradas del editor aún
reporta tres diagnósticos anteriores en el editor bitmap, ajenos a estos controles.

La demo `output/demos/path-timing.html` utiliza el mismo componente temporal y
el mismo baker del editor. Se comprobó en navegador el cambio de geometría
conservando el preset, edición de porcentajes y división de intervalos. La nueva
capa temporal pasó la compilación de producción y las pruebas del baker;
la prueba OpenMSX descrita arriba corresponde al método de espaciado anterior.
