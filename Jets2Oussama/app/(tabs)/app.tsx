import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Animated, StatusBar, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRAVITY = 0.6;
const FLAP_STRENGHT = -10;
const PIPE_WIDTH = 80;
const PIPE_GAP = 200;
const PIPE_SPEED = 3;
const BIRD_SIZE = 40;
const COIN_SIZE = 30;

export default function App() {
      const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  
  const birdY = useRef(new Animated.Value(SCREEN_HEIGHT / 2 - BIRD_SIZE / 2)).current;
  const birdRotation = useRef(new Animated.Value(0)).current;
  const birdVelocity = useRef(0);
  const pipes = useRef([]);
  const coinsList = useRef([]);
  const gameLoop = useRef(null);
  const pipeTimer = useRef(null);
  
  // Sons
  const flapSound = useRef(null);
  const scoreSound = useRef(null);
  const coinSound = useRef(null);
  const gameOverSound = useRef(null);

  useEffect(() => {
    loadSounds();
    loadGameData();
    return () => {
        unloadSounds();
    };
  }, []);

  const loadSounds = async () => {
    try {
        const { sound: score } = await Audio.Sound.createAsync(
            { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn7KtdGAo+ltryxHUlBS955/LBfC8IF2i56uKiUA0NTqXh8bllHAU2j9Xxw3kkBS575/PMgi8IF2i56uekUhENTqXh8blmHQU2j9TxwnglBSx75/PMgi8IF2m46+KiUBENTqXi8blnHgU2jtTxwnglBSt85/PMgi8IFmm46+OjUREOTqTi8blnHgU1jdTxwnYlBSt85/PLgi8IFmm56+OjUhEOTqTi8blnHgU1jdTxwnYlBSp85/PMgi8IFmm56+OjUhEOTqTi8LlnHgU1jdTxwnYlBSp85/PMgi8IFmm56+KiURENTqPi8LlmHgU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBSp85/PMgi8IFmm56+OjURENTqPi8LlmHQU1jdTxwnYlBSp85/PMgi8IFmm56+OjURENTqPi8blmHQU1jdTxwnYlBSp85/PMgi8IFmm56+OjURENTqPi8blmHQU1jdTxwnYlBSp85/PMgi8IFmm56+OjURENTqPi8blmHQU1jdTxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdTxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdTxwnYlBQ=='},
            { shouldPlay: false}
        );
        flapSound.current = flap;

        const { sound: score } = await Audio.Sound.createAsync(
            { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn7KtdGAo+ltryxHUlBS955/LBfC8IF2i56uKiUA0NTqXh8bllHAU2j9Xxw3kkBS575/PMgi8IF2i56uekUhENTqXh8blmHQU2j9TxwnglBSx75/PMgi8IF2m46+KiUBENTqXi8blnHgU2jtTxwnglBSt85/PMgi8IFmm46+OjUREOTqTi8blnHgU1jdTxwnYlBSt85/PLgi8IFmm56+OjUhEOTqTi8blnHgU1jdTxwnYlBSp85/PMgi8IFmm56+OjUhEOTqTi8LlnHgU1jdTxwnYlBSp85/PMgi8IFmm56+KiURENTqPi8LlmHgU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBSp85/PMgi8IFmm56+KjURENTqPi8LlmHQU1jdPxwnYlBQ==' },
            { shouldPlay: false }
        );
        scoreSound.current = score;
      
        const { sound: coin } = await Audio.Sound.createAsync(
            { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn7KtdGAo+ltryxHUlBS955/LBfC8IF2i56uKiUA0NTqXh8bllHAU2j9Xxw3kkBS575/PMgi8IF2i56uekUhENTqXh8blmHQU2j9TxwnglBSx75/PMgi8IF2m46+KiUBENTqXi8blnHgU2jtTxwnglBSt85/PMgi8IFmm46+OjUREOTqTi8blnHgU1jdTxwnYlBQ==' },
            { shouldPlay: false }
        );
        coinSound.current = coin;
      
        const { sound: gameov } = await Audio.Sound.createAsync(
            { uri: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn7KtdGAo+ltryxHUlBS955/LBfC8IF2i56uKiUA0NTqXh8bllHAU2j9Xxw3kkBS575/PMgi8IF2i56uekUhENTqXh8blmHQU2j9TxwnglBQ==' },
            { shouldPlay: false }
        );
        gameOverSound.current = gameov;
        } catch (error) {
            console.log('Erreur chargement sons:', error);
        }
        }
    }

};