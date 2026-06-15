# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Stripe Android SDK core
-keep class com.stripe.android.** { *; }
-dontwarn com.stripe.android.**

# Push provisioning (fix R8 crash)
-keep class com.stripe.android.pushProvisioning.** { *; }
-dontwarn com.stripe.android.pushProvisioning.**

# Add any project specific keep options here:

############################################
# REACT NATIVE CORE
############################################
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.** { *; }

############################################
# REACT NATIVE NEW ARCHITECTURE
############################################
-keep class com.swmansion.reanimated.** { *; }

############################################
# STRIPE
############################################
-keep class com.stripe.android.** { *; }
-dontwarn com.stripe.android.**

############################################
# PUSH PROVISIONING (CRASH FIX)
############################################
-keep class com.stripe.android.pushProvisioning.** { *; }
-dontwarn com.stripe.android.pushProvisioning.**

############################################
# REALM (si utilisé)
############################################
-keep class io.realm.** { *; }
-dontwarn io.realm.**

############################################
# WEBRTC (si appels audio/vidéo)
############################################
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**
