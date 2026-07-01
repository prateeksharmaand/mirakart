import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens ported 1:1 from the Clotya theme reference
/// (themereference/main-theme/clotya/clotya/assets/scss/_theme.scss)
/// so the Flutter app matches the Next.js apps' visual language.
/// Mirrors packages/config/tailwind-preset.ts — keep both in sync.
class AppColors {
  AppColors._();

  static const background = Color(0xFFFFFFFF);
  static const backgroundLight = Color(0xFFFAFAFA);
  static const foreground = Color(0xFF000000);
  static const foregroundMuted = Color(0xFF75767C);
  static const primary = Color(0xFFEE403D);
  static const success = Color(0xFF47B486);
  static const successDark = Color(0xFF287C58);
  static const successLight = Color(0xFFC9E3D8);
  static const warning = Color(0xFFF5AF28);
  static const warningLight = Color(0xFFF4E3D1);
  static const danger = Color(0xFFF4344F);
  static const info = Color(0xFFAEB9BE);
  static const border = Color(0xFFDEE0EA);
  static const formBorder = Color(0xFFDDDDDD);
  static const formActive = Color(0xFF8F8F8F);
  static const formPlaceholder = Color(0xFF75767C);
}

class AppRadius {
  AppRadius._();

  static const sm = 2.0;
  static const md = 4.0;
  static const lg = 8.0;
  static const pill = 60.0;
}

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    final textTheme = GoogleFonts.jostTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        error: AppColors.danger,
        surface: AppColors.background,
      ),
      textTheme: textTheme.apply(
        bodyColor: AppColors.foreground,
        displayColor: AppColors.foreground,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.background,
        hintStyle: const TextStyle(color: AppColors.formPlaceholder),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.formBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          borderSide: const BorderSide(color: AppColors.formActive),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(42),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.foreground,
        elevation: 0,
      ),
    );
  }
}
