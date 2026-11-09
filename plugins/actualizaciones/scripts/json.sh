#!/bin/bash
# Lee valores de un JSON sin depender de plutil (que solo existe en Mac). Se carga con "source".
# Esta misma copia vive en plugins/actualizaciones, plugins/adaptar y plugins/seguridad
# (cada plugin se instala solo). Una prueba verifica que las tres sean idénticas: no edites una sola.
#
#   json_get  <archivo> <ruta.con.puntos>   imprime el valor (texto, número o true/false), o nada. Siempre sale 0.
#   json_keys <archivo> <ruta.con.puntos>   imprime una llave por línea de un objeto, o nada. Siempre sale 0.
#
# La ruta se parte por "." y un tramo de solo dígitos indexa una lista. Las llaves pueden llevar @ y -, nunca ".".
# Orden de herramientas: plutil (Mac), luego perl con JSON::PP, luego Python (python3, python, py -3).
#
# Ganchos solo para pruebas:
#   JSON_SIN_PLUTIL=1  actúa como si plutil no existiera.
#   JSON_SIN_PERL=1    actúa como si perl no existiera.

_JSON_PERL='use strict; use JSON::PP;
my ($m,$f,$p)=@ARGV;
open(my $h,"<:raw",$f) or exit 0;
local $/; my $t=<$h>; close $h;
$t =~ s/^\xEF\xBB\xBF//;
my $d=eval{JSON::PP->new->utf8->allow_nonref->decode($t)};
exit 0 unless defined $d;
for my $s (length($p) ? split(/\./,$p) : ()) {
  if (ref $d eq "HASH") { exit 0 unless exists $d->{$s}; $d=$d->{$s}; }
  elsif (ref $d eq "ARRAY") { exit 0 unless $s =~ /^\d+$/ && $s < @$d; $d=$d->[$s]; }
  else { exit 0; }
}
binmode STDOUT,":utf8";
if ($m eq "keys") { if (ref $d eq "HASH") { print "$_\n" for sort keys %$d; } exit 0; }
exit 0 unless defined $d;
if (ref $d eq "JSON::PP::Boolean") { print(($d ? "true" : "false")."\n"); exit 0; }
exit 0 if ref $d;
print "$d\n";'

_JSON_PY='import sys, json
try:
    m, f, p = sys.argv[1:4]
    with open(f, encoding="utf-8-sig") as h:
        d = json.load(h)
    for s in (p.split(".") if p else []):
        if isinstance(d, dict):
            d = d[s]
        elif isinstance(d, list) and s.isdigit():
            d = d[int(s)]
        else:
            raise KeyError(s)
    out = ""
    if m == "keys":
        if isinstance(d, dict):
            out = "".join(k + "\n" for k in sorted(d))
    elif isinstance(d, bool):
        out = "true\n" if d else "false\n"
    elif isinstance(d, (str, int, float)):
        out = str(d) + "\n"
    sys.stdout.buffer.write(out.encode("utf-8"))
except Exception:
    pass'

_json_py() {
  local c a
  for c in python3 python py; do
    command -v "$c" >/dev/null 2>&1 || continue
    a=(); [ "$c" = py ] && a=(-3)
    "$c" "${a[@]}" -I -c "$_JSON_PY" "$@" 2>/dev/null && return 0
  done
  return 1
}

_json_leer() {
  local modo="$1" f="$2" p="$3"
  [ -f "$f" ] || return 0
  if [ -z "${JSON_SIN_PLUTIL:-}" ] && command -v plutil >/dev/null 2>&1; then
    plutil -extract "$p" raw -o - "$f" 2>/dev/null
    return 0
  fi
  if [ -z "${JSON_SIN_PERL:-}" ] && command -v perl >/dev/null 2>&1; then
    perl -e "$_JSON_PERL" "$modo" "$f" "$p" 2>/dev/null && return 0
  fi
  _json_py "$modo" "$f" "$p" || true
  return 0
}

json_get() { _json_leer get "$1" "$2"; return 0; }
json_keys() { _json_leer keys "$1" "$2"; return 0; }
