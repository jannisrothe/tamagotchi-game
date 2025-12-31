# Tamagotchi Virtual Pet

A classic 8-bit style Tamagotchi game built with vanilla JavaScript, HTML, and CSS.

## Features

- **Four Life Stages**: Egg → Baby → Child → Adult
- **Three Stats**: Hunger, Happiness, and Health
- **Four Actions**: Feed, Play, Clean, and Heal
- **Authentic 8-bit Pixel Art**: Black, white, and grey color scheme
- **State Persistence**: Game saves automatically to localStorage
- **Real-time Aging**: Your pet grows and evolves over time
- **Care Mechanics**: Keep your pet clean and healthy to prevent sickness

## How to Play

1. **Feed**: Keep hunger levels up by feeding your pet
2. **Play**: Increase happiness by playing games
3. **Clean**: Remove dirt to maintain health
4. **Heal**: Give medicine when your pet is sick

## Stats

- **♥ Hunger**: Decreases over time, feed to restore
- **☺ Happiness**: Decreases slowly, play to restore
- **+ Health**: Decreases when pet is dirty, sick, or neglected

## Evolution

- **Egg** (Age 0-4): Starting stage
- **Baby** (Age 5-19): First evolution
- **Child** (Age 20-39): Second evolution
- **Adult** (Age 40+): Final form

## Deploy to Netlify

1. Push this folder to a Git repository
2. Connect your repository to Netlify
3. Deploy with default settings

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify deploy
```

## Local Development

Simply open `index.html` in your browser. No build process required!
