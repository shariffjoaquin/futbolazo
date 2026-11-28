-- Futbolazo: tabla de jugadores para Supabase (spec §2.15, plan decisión 23).
-- Pegar en el SQL Editor y correr ANTES de seed.sql. Se puede volver a correr sin error.
-- Las listas de nacionalidad, posición y pie deben coincidir con lib/importPlayers.ts (lo revisa un test).
-- Ojo: "create table if not exists" no cambia una tabla ya creada; si cambian las restricciones,
-- borrar la tabla (drop table public.players;) o alterarla a mano.

create table if not exists public.players (
  temporada        integer not null check (temporada between 2000 and 2100),
  jugador_id       text    primary key check (btrim(jugador_id) <> ''),
  nombre           text    not null check (btrim(nombre) <> ''),
  club_id          text    not null check (btrim(club_id) <> ''),
  club_nombre      text    not null check (btrim(club_nombre) <> ''),
  nacionalidad     text    not null check (nacionalidad in ('Perú', 'Argentina', 'Uruguay', 'Paraguay', 'Chile', 'Ecuador', 'Bolivia', 'Brasil', 'Colombia', 'Venezuela', 'México', 'España', 'Italia', 'Panamá')),
  posicion         text    not null check (posicion in ('POR', 'DEF', 'MED', 'DEL')),
  fecha_nacimiento date    not null,
  dorsal           integer not null check (dorsal between 1 and 99),
  pie              text    not null check (pie in ('D', 'I', 'Ambos')),
  elegible         boolean not null default true,
  -- Fuente y verificación (informativas, no las usa el juego).
  fuente           text,
  verificado_en    date,
  verif_fecha      text,
  verif_dorsal     text,
  verif_pie        text,
  notas_revision   text,
  constraint players_dorsal_unico_por_club unique (temporada, club_id, dorsal)
);

comment on table public.players is
  'Jugadores de Liga 1 cargados desde data/raw/liga1-<temporada>.csv. elegible = false: no sale como jugador secreto.';

-- Seguridad: RLS activada y una sola política, lectura pública de los elegibles.
alter table public.players enable row level security;

drop policy if exists "Lectura pública de jugadores elegibles" on public.players;
create policy "Lectura pública de jugadores elegibles"
  on public.players
  for select
  to anon
  using (elegible = true);

-- Sin escritura para el público. Supabase da por defecto todos los permisos en "public" a anon y
-- authenticated; RLS ya bloquea la escritura (no hay políticas de insert/update/delete), y esto lo deja explícito.
revoke all on table public.players from anon, authenticated;
grant select on table public.players to anon;
