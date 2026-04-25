<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the web site, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * Localized language
 * * ABSPATH
 *
 * @link https://wordpress.org/support/article/editing-wp-config-php/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'local' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',          '!6mXxG VZ4rd>G8JL=&0Unou0Gp]@zp>+6.IuzPD~UWy>>1k:c(TP3[;B8@6gAn$' );
define( 'SECURE_AUTH_KEY',   '~ukx6=6|QoM0H>~h<Ofws=!o|%dNN/IHtSp~8cdjw)6:f^Oy} )<K7dW[=:(K`#&' );
define( 'LOGGED_IN_KEY',     '^zI[Y7p5B-6d7ls3;w5w~akeYp%nOgrKe &/fG--l);6C}gN:,x:P9=,dt^j@R@|' );
define( 'NONCE_KEY',         'yN$Zd=~rec ar9W%w>S?@{m!tS1c6<?H2Q&-t]M0hq|v;+?,.KB;,):Dam~yeF^[' );
define( 'AUTH_SALT',         '#bXM 4Y<&2lA5rN.SZ_h[oEVfxqw(aWO]*oykY/Ml^V35~-A }2`Idf~LSM]~cUO' );
define( 'SECURE_AUTH_SALT',  '`G5,DekoiC2,djD){RdnlQ,i!OYpDY$/p[NM75LiB[@WpA*Lx h{`$)|q#e?S:)}' );
define( 'LOGGED_IN_SALT',    '`j{ij qmi8NHNY*?!OX;:TVRXh8]{e~|wf$B>WgI9ZpI RhF$Kd+lsli45T>0s0Y' );
define( 'NONCE_SALT',        'V;fKaf! m!=[*x~@n`hFy|y7d)tT/?^Ak7( Iunp^84pJC*%!7^[L*5`}7wM#dzL' );
define( 'WP_CACHE_KEY_SALT', ';:G/{i|cMZAtR(Cb(Pm6iY%EPiT_x[,0fhr9L#:^+HAp(8.>~!Pc<Hyf+q4=_Qwj' );


/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';


/* Add any custom values between this line and the "stop editing" line. */



/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://wordpress.org/support/article/debugging-in-wordpress/
 */
if ( ! defined( 'WP_DEBUG' ) ) {
	define( 'WP_DEBUG', true );
	define( 'WP_DEBUG_LOG', true );
	define( 'WP_DEBUG_DISPLAY', false );
}

define( 'WP_ENVIRONMENT_TYPE', 'local' );
/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
