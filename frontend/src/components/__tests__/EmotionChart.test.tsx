/**
 * Frontend test: EmotionChart component
 * Test chart rendering with emotion data
 */
import { render, screen } from "@testing-library/react"
import { EmotionChart } from "../EmotionChart"

// Mock Chart.js components
jest.mock("react-chartjs-2", () => ({
  Line: () => <div data-testid="line-chart">Chart</div>,
}))

describe("EmotionChart Component", () => {
  const mockData = [
    {
      timestamp: 0,
      emotion: "agreement",
      confidence: 8.0,
    },
    {
      timestamp: 10,
      emotion: "enthusiasm",
      confidence: 7.5,
    },
  ]

  test("renders chart with emotion data", () => {
    render(<EmotionChart data={mockData} />)

    const chart = screen.getByTestId("line-chart")
    expect(chart).toBeInTheDocument()
  })

  test("shows empty state when no data", () => {
    render(<EmotionChart data={[]} />)

    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument()
  })

  test("handles custom height prop", () => {
    render(<EmotionChart data={mockData} height={500} />)

    const chart = screen.getByTestId("line-chart")
    expect(chart).toBeInTheDocument()
  })

  test("uses default height when not specified", () => {
    render(<EmotionChart data={mockData} />)

    const chart = screen.getByTestId("line-chart")
    expect(chart).toBeInTheDocument()
  })

  test("handles undefined data", () => {
    render(<EmotionChart data={undefined as any} />)

    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument()
  })

  test("handles null data", () => {
    render(<EmotionChart data={null as any} />)

    expect(screen.getByText(/No emotion data available/i)).toBeInTheDocument()
  })
})
