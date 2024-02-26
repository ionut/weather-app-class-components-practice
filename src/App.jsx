import { Component } from 'react'

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

export default class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      location: "Iasi", isLoading: false, displayLocation: "", weather: {}
    }

    this.fetchWeather = this.fetchWeather.bind(this)
  }

  async fetchWeather() {
    try {
      this.setState({ isLoading: true })
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({ displayLocation: `${name} ${convertToFlag(country_code)}` })

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();

      this.setState({ weather: weatherData.daily })
    } catch (err) {
      console.err(err);
    } finally {
      this.setState({ isLoading: false })
    }
  }

  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <div>
          <input type="text" placeholder="Search for location" value={this.state.location} onChange={e => this.setState({ location: e.target.value })} />
        </div>
        <button onClick={this.fetchWeather}>Get weather</button>
        {this.state.isLoading && <p className="loader">Loading...</p>}
        {this.state.weather.weathercode && <Weather weather={this.state.weather} location={this.state.displayLocation} />}
      </div>
    )
  }
}

class Weather extends Component {
  render() {
    const { temperature_2m_max: maxTemp, temperature_2m_min: minTemp, time: dates, weathercode: codes } = this.props.weather;

    return (
      <div>
        <h2>Weather in {this.props.location}</h2>
        <ul className="weather">
          {dates.map((date, index) => (<Day key={date} date={date} maxTemp={maxTemp.at(index)} minTemp={minTemp.at(index)} code={codes.at(index)} isToday={index === 0} />))}
        </ul>
      </div>
    )
  }
}

class Day extends Component {
  render() {
    const { date, maxTemp, minTemp, code, isToday } = this.props
    return <li className="day">
      <span>{getWeatherIcon(code)}</span>
      <p>{isToday ? "Today" : date}</p>
      <p>{minTemp}&deg; &mdash; {maxTemp}&deg;</p>

    </li>
  }
}