# Contributing to nAnalyzer

Thank you for your interest in contributing to nAnalyzer! We welcome contributions from the community.

## Getting Started

1. **Fork the repository** and clone it locally
2. **Read the [Constitution](.specify/memory/constitution.md)** to understand our core principles
3. **Set up your development environment** (see README.md)
4. **Create a feature branch** for your changes

## Development Workflow

### Before You Start

- Check existing issues and PRs to avoid duplicate work
- Open an issue to discuss major changes before implementing
- Ensure your contribution aligns with our privacy-first, local-processing principles

### Making Changes

1. **Write tests first** (Test-Driven Development)
   - Unit tests for new modules/functions
   - Integration tests for API endpoints
   - End-to-end tests for complete workflows

2. **Implement your changes**
   - Follow existing code style (Black for Python, Prettier for TypeScript)
   - Add type hints (Python) and types (TypeScript)
   - Keep changes minimal and focused

3. **Document your changes**
   - Update README if adding features
   - Add docstrings to new functions/classes
   - Update API documentation if changing endpoints

4. **Test thoroughly**
   ```bash
   # Backend tests
   cd backend
   pytest tests/ -v --cov=app
   
   # Frontend tests
   cd frontend
   npm test
   ```

5. **Lint and format**
   ```bash
   # Backend
   cd backend
   black app/ tests/
   mypy app/
   flake8 app/
   
   # Frontend
   cd frontend
   npm run lint:fix
   npm run format
   ```

### Submitting Changes

1. **Commit your changes** with clear, descriptive messages
   ```
   git commit -m "Add real-time sentiment visualization component"
   ```

2. **Push to your fork**
   ```
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request**
   - Describe what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes
   - Ensure all CI checks pass

## Code Style Guidelines

### Python

- Follow PEP 8
- Use type hints for all function signatures
- Maximum line length: 100 characters
- Use async/await for I/O operations
- Add docstrings to all public functions

Example:
```python
async def analyze_sentiment(text: str) -> SentimentResult:
    """
    Analyze the sentiment of the given text.
    
    Args:
        text: The text to analyze
        
    Returns:
        SentimentResult with label, score, and timestamp
    """
    # Implementation
```

### TypeScript/React

- Use functional components with hooks
- Add TypeScript types for all props and state
- Use meaningful component and variable names
- Keep components small and focused

Example:
```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, trend }) => {
  // Implementation
};
```

## What to Contribute

### Good First Issues

- Bug fixes in existing modules
- Improving documentation
- Adding unit tests
- UI/UX improvements
- Performance optimizations

### Feature Contributions

- New ML models (must run locally)
- Additional telephony integrations
- Enhanced visualization components
- Improved analysis algorithms
- Multi-language support

### What We Don't Accept

- Cloud-based processing (violates privacy principle)
- Dependencies on proprietary services
- Features that compromise user privacy
- Breaking changes without migration path
- Untested code

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow our Code of Conduct

## Questions?

- Open a GitHub issue for bugs or feature requests
- Join our Discord for discussions
- Email us at dev@nanalyzer.dev

Thank you for contributing to nAnalyzer! 🎙️
