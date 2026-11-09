#!/bin/bash
# Deja prendido el auto-update del setup-ceo en settings.json del dueño. Se carga con "source" después de comun.sh.
# Copia la fuente EXACTA de known_marketplaces.json (si difiere, Claude Code ignora el catálogo y sus plugins no cargan):
# nunca agrega "ref" ni cambia la fuente. Si algo no calza, no escribe nada.
#
#   archivo_ajustes   imprime la ruta de settings.json
#   asegurar_auto     CAMBIO: activado | CAMBIO: copiado | SIN-CAMBIO | OMITIDO: <razón>
#   poner_auto si|no  AUTO: si | AUTO: no | OMITIDO: <razón>
#   Razones de OMITIDO: sin-perl, sin-perl-json (hay perl pero le falta JSON::PP), sin-fuente, no-oficial, ref-propio, fuente-distinta, valor-invalido,
#   settings-invalido (JSON malo o enlace roto), no-se-pudo-escribir (falló el respaldo, el temporal o el renombrado).
#   estado_auto       AUTO: si|no|sin-dato, REF: <ref|ninguno>, FUENTE: oficial|otra|ninguna
# Si el dueño apagó las actualizaciones con auto.sh (marca auto-apagado en la carpeta de datos), asegurar_auto
# nunca las prende: si falta la entrada o el valor, escribe autoUpdate:false.
# Siempre salen 0.
REPO_OFICIAL="josephalbertoeshkenazi-blip/setup-ceo"

_AJUSTES_PERL='use strict; use warnings; use JSON::PP; use Cwd (); use File::Copy ();
my ($modo,$valor,$sf,$kf,$mk,$repo,$apagado)=@ARGV;
binmode STDOUT,":utf8";
sub fin { print "$_[0]\n"; exit 0; }
sub leer {
  my $f=shift;
  open(my $h,"<:raw",$f) or return undef;
  local $/; my $t=<$h>; close $h;
  $t =~ s/^\xEF\xBB\xBF//;
  my $d=eval{JSON::PP->new->utf8->allow_nonref->decode($t)};
  return $d;
}
sub igual {
  my ($a,$b)=@_;
  return 1 if !defined $a && !defined $b;
  return 0 if !defined $a || !defined $b;
  return 0 if ref $a ne ref $b;
  if (ref $a eq "HASH") {
    return 0 unless keys %$a == keys %$b;
    for (keys %$a) { return 0 unless exists $b->{$_} && igual($a->{$_},$b->{$_}); }
    return 1;
  }
  if (ref $a eq "ARRAY") {
    return 0 unless @$a == @$b;
    for (0..$#$a) { return 0 unless igual($a->[$_],$b->[$_]); }
    return 1;
  }
  if (ref $a eq "JSON::PP::Boolean") { return (($a ? 1 : 0) == ($b ? 1 : 0)) ? 1 : 0; }
  return 0 if ref $a;
  return "$a" eq "$b" ? 1 : 0;
}
sub texto { my $v=shift; defined $v && !ref $v ? "$v" : "" }
sub oficial {
  my $k=shift; my $r=quotemeta $repo;
  my $s=texto($k->{source});
  return 1 if $s eq "github" && lc(texto($k->{repo})) eq lc($repo);
  return 1 if $s eq "git" && texto($k->{url}) =~ m{^(https://github\.com/|git\@github\.com:)$r(\.git)?/?$}i;
  return 0;
}
sub bool_de { my $v=shift; (defined $v && JSON::PP::is_bool($v)) ? ($v ? "si" : "no") : undef }

my $kd=leer($kf);
my $ke=(ref $kd eq "HASH" && ref $kd->{$mk} eq "HASH") ? $kd->{$mk} : undef;
my $K=$ke ? $ke->{source} : undef;
$K=undef unless ref $K eq "HASH";

my ($S,$settings_ok)=({},1);
if (-e $sf) {
  $S=leer($sf);
  $settings_ok=0 unless ref $S eq "HASH";
}
my $E;
if ($settings_ok && ref $S->{extraKnownMarketplaces} eq "HASH") { $E=$S->{extraKnownMarketplaces}{$mk}; }
elsif ($settings_ok && exists $S->{extraKnownMarketplaces}) { $settings_ok=0; }
$settings_ok=0 if defined $E && ref $E ne "HASH";

if ($modo eq "estado") {
  my $F=$K; $F=$E->{source} if !$F && ref $E eq "HASH" && ref $E->{source} eq "HASH";
  my $auto=(ref $E eq "HASH" ? bool_de($E->{autoUpdate}) : undef);
  $auto=bool_de($ke->{autoUpdate}) if !defined $auto && $ke;
  print "AUTO: ".(defined $auto ? $auto : "sin-dato")."\n";
  my $ref=$F ? texto($F->{ref}) : "";
  print "REF: ".(length $ref ? $ref : "ninguno")."\n";
  print "FUENTE: ".(!$F ? "ninguna" : oficial($F) ? "oficial" : "otra")."\n";
  exit 0;
}

fin("OMITIDO: valor-invalido") if $modo eq "auto" && $valor ne "si" && $valor ne "no";
fin("OMITIDO: sin-fuente") unless $K;
fin("OMITIDO: no-oficial") unless oficial($K);
fin("OMITIDO: ref-propio") if exists $K->{ref} && defined $K->{ref} && length texto($K->{ref});
fin("OMITIDO: settings-invalido") unless $settings_ok;
fin("OMITIDO: settings-invalido") if -l $sf && !-e $sf;
my $quiere = $valor eq "si" ? JSON::PP::true : JSON::PP::false;

my ($mensaje,$cambia)=("SIN-CAMBIO",0);
if (ref $E eq "HASH") {
  fin("OMITIDO: fuente-distinta") unless igual($E->{source},$K);
  if ($modo eq "auto") {
    my $actual=bool_de($E->{autoUpdate});
    if (!defined $actual || $actual ne $valor) { $E->{autoUpdate}=$quiere; $cambia=1; }
  } elsif (!exists $E->{autoUpdate}) {
    my $b=$ke->{autoUpdate}; my $x=(defined $b && JSON::PP::is_bool($b)) ? $b : JSON::PP::true;
    $x=JSON::PP::false if $apagado;
    $E->{autoUpdate}=$x; ($mensaje,$cambia)=($x ? "CAMBIO: activado" : "CAMBIO: copiado",1);
  }
} else {
  my $x=JSON::PP::true;
  if ($modo eq "auto") { $x=$quiere; }
  else { my $b=$ke->{autoUpdate}; $x=$b if defined $b && JSON::PP::is_bool($b); $x=JSON::PP::false if $apagado; }
  $S->{extraKnownMarketplaces}={} unless ref $S->{extraKnownMarketplaces} eq "HASH";
  $S->{extraKnownMarketplaces}{$mk}={source=>$K,autoUpdate=>$x};
  $cambia=1;
  $mensaje = $x ? "CAMBIO: activado" : "CAMBIO: copiado";
}
$mensaje="AUTO: $valor" if $modo eq "auto";

if ($cambia) {
  my $real=-l $sf ? (Cwd::abs_path($sf) // $sf) : $sf;
  my $json=JSON::PP->new->utf8->canonical->pretty->indent_length(2)->space_before(0);
  my $antes=$real.".antes-de-setup-ceo";
  my $tmp="$real.setup-ceo-tmp.$$";
  umask 077;
  my $ok=eval {
    if (-f $real && !-e $antes) {
      File::Copy::copy($real,$antes) or die;
      my $m=(stat $real)[2]; chmod($m & 07777,$antes) if defined $m;
    }
    open(my $o,">:raw",$tmp) or die;
    my $t=$json->encode($S); $t.="\n" unless $t =~ /\n\z/; print $o $t; close $o or die;
    my $v=leer($tmp); die unless ref $v eq "HASH" && igual($v,$S);
    my $modo_orig=(stat $real)[2]; chmod($modo_orig & 07777,$tmp) if defined $modo_orig;
    rename($tmp,$real) or die;
    1;
  };
  unless ($ok) { unlink $tmp; fin("OMITIDO: no-se-pudo-escribir"); }
}
fin($mensaje);'

archivo_ajustes() { printf '%s\n' "$CONF/settings.json"; return 0; }

_ajustes_perl() {
  local falta=""
  if [ -n "${JSON_SIN_PERL:-}" ] || ! command -v perl >/dev/null 2>&1; then falta=sin-perl
  elif ! perl -MJSON::PP -e1 >/dev/null 2>&1; then falta=sin-perl-json
  fi
  if [ -n "$falta" ]; then
    case "$1" in estado) echo "AUTO: sin-dato"; echo "REF: ninguno"; echo "FUENTE: ninguna" ;; *) echo "OMITIDO: $falta" ;; esac
    return 0
  fi
  local apagado=""; [ -e "$(carpeta_datos)/auto-apagado" ] && apagado=1
  perl -e "$_AJUSTES_PERL" "$1" "$2" "$(archivo_ajustes)" "$KNOWN" "$MERCADO" "$REPO_OFICIAL" "$apagado" 2>/dev/null || echo "OMITIDO: settings-invalido"
  return 0
}

asegurar_auto() { _ajustes_perl asegurar ""; return 0; }
poner_auto() { _ajustes_perl auto "$1"; return 0; }
estado_auto() { _ajustes_perl estado ""; return 0; }
