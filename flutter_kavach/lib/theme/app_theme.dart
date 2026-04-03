import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Kavach Sentinel Theme Colors
  static const Color navy = Color(0xFF001F3F);
  static const Color skyBlue = Color(0xFF0C6780);
  static const Color gold = Color(0xFF705D00);
  static const Color green = Color(0xFF2ECC71);
  static const Color orange = Color(0xFFF39C12);
  static const Color red = Color(0xFFBA1A1A);
  
  static const Color background = Color(0xFFF8F9FA);
  static const Color surfaceLow = Color(0xFFF3F4F5);
  static const Color surfaceLowest = Color(0xFFFFFFFF);
  static const Color textPrimary = Color(0xFF191C1D);
  static const Color textSecondary = Color(0xFF43474E);
  static const Color outlineVariant = Color(0xFFC4C6CF);

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: background,
      primaryColor: navy,
      colorScheme: const ColorScheme.light(
        primary: navy,
        secondary: skyBlue,
        tertiary: gold,
        error: red,
        surface: background,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onTertiary: Colors.white,
        onSurface: textPrimary,
      ),
      textTheme: TextTheme(
        displayLarge: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.bold, color: textPrimary),
        displayMedium: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.bold, color: textPrimary),
        displaySmall: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.bold, color: textPrimary),
        headlineMedium: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w600, color: textPrimary),
        headlineSmall: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
        titleLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: textPrimary),
        bodyLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.normal, color: textPrimary),
        bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.normal, color: textPrimary),
        labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: textSecondary),
        labelMedium: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.normal, color: textSecondary),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.manrope(fontSize: 24, fontWeight: FontWeight.bold, color: textPrimary),
        iconTheme: const IconThemeData(color: navy),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLowest,
        selectedItemColor: skyBlue,
        unselectedItemColor: textSecondary,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: navy,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
          elevation: 0,
        ),
      ),
      cardTheme: CardThemeData(
        color: surfaceLowest,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: EdgeInsets.zero,
      ),
    );
  }
}
