# Contributing to Worldbuilder

Thank you for your interest in contributing to Worldbuilder! 🎉

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/worldbuilder.git
   cd worldbuilder
   ```
3. **Install dependencies** (see [SETUP.md](./SETUP.md))
4. **Create a branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

## 🎯 Ways to Contribute

### **1. Bug Reports**
Found a bug? Open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details

### **2. Feature Requests**
Have an idea? Open an issue with:
- Clear description of the feature
- Use cases
- Why it's valuable
- Any implementation ideas

### **3. Code Contributions**
Want to code? Great!

**Priority Areas:**
- Railway deployment integration
- Component editing functionality
- Undo/redo on canvas
- Syntax highlighting in code preview
- Additional helper templates
- Test generation (Enforcer component)
- Audit trails (Auditor component)

### **4. Documentation**
- Fix typos or unclear sections
- Add examples
- Create tutorials
- Translate to other languages

### **5. Templates**
- Create new code generation templates
- Improve existing templates
- Add support for new integrations

## 📝 Code Style

We use:
- **TypeScript** (strict mode)
- **ESLint** (Airbnb config)
- **Prettier** for formatting

Before committing:
```bash
# Lint
npm run lint

# Format
npm run format

# Type check
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit
```

## 🏗️ Project Structure

```
frontend/          React + TypeScript
  src/
    components/    Reusable UI components
    pages/         Page components
    stores/        State management (Zustand)
    lib/           Utilities

backend/           Node.js + Express
  src/
    routes/        API endpoints
    services/      Business logic
    middleware/    Express middleware
    utils/         Utilities

templates/         Handlebars templates
  element/         Entity templates
  manipulator/     API templates
  worker/          Job templates
  helper/          Integration templates
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Test coverage
npm run test:coverage
```

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Follow code style** (ESLint + Prettier)
4. **Write clear commit messages**
   ```
   feat: Add Railway deployment integration
   fix: Resolve canvas auto-save issue
   docs: Update setup instructions
   ```
5. **Create PR** with:
   - Clear title
   - Description of changes
   - Related issue number (if applicable)
   - Screenshots (for UI changes)

## 🎨 UI/UX Guidelines

- **Tailwind CSS** for styling
- **Consistent spacing** (4px, 8px, 12px, 16px, 24px, 32px)
- **Color scheme** - Follow existing design system
- **Animations** - Subtle and smooth
- **Accessibility** - ARIA labels, keyboard navigation
- **Responsive** - Mobile-friendly

## 🔧 Adding New Features

### **New Component Type:**
1. Create modal in `frontend/src/components/modals/`
2. Add to Canvas.tsx drag-and-drop handler
3. Create backend route handler
4. Create Handlebars template(s)
5. Add to CodeGenerator.service.ts
6. Update documentation

### **New Template:**
1. Create `.hbs` file in `templates/`
2. Use existing helpers (pascalCase, etc.)
3. Test with sample data
4. Document in `templates/README.md`
5. Add to CodeGenerator.service.ts

### **New Helper Integration:**
1. Add to `HELPER_TEMPLATES` in HelperModal.tsx
2. Create template in `templates/helper/service.ts.hbs`
3. Add conditional logic for integration
4. Update package.json dependency detection
5. Document environment variables

## 🐛 Debugging Tips

### **Frontend:**
- Use React DevTools
- Check browser console
- Inspect network requests
- Check Zustand state in devtools

### **Backend:**
- Check terminal logs
- Use Winston logger
- Test endpoints with Postman/curl
- Check Prisma Studio for database

### **Code Generation:**
- Test templates in isolation
- Check template helper output
- Verify file paths
- Test with sample schemas

## 📚 Resources

- **React Flow:** https://reactflow.dev/
- **Prisma:** https://www.prisma.io/docs
- **Handlebars:** https://handlebarsjs.com/
- **OpenAI API:** https://platform.openai.com/docs
- **Supabase:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

## ⚠️ Important Notes

### **Don't:**
- Commit `.env` files
- Push directly to main
- Skip tests for new features
- Break existing functionality
- Add dependencies without discussion

### **Do:**
- Write clear, self-documenting code
- Add comments for complex logic
- Update documentation
- Follow TypeScript strict mode
- Handle errors gracefully
- Add loading states
- Show user feedback (toasts)

## 🎓 Code Review Checklist

Before requesting review:
- [ ] Code follows style guide
- [ ] Tests pass
- [ ] No linter errors
- [ ] TypeScript compiles
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main
- [ ] Screenshots added (if UI change)

## 🌟 Recognition

Contributors will be:
- Listed in README
- Mentioned in release notes
- Given credit in documentation

## 📞 Questions?

- Open a GitHub Discussion
- Join our Discord (coming soon)
- Email: support@worldbuilder.dev (coming soon)

## 🎉 Thank You!

Every contribution, no matter how small, makes Worldbuilder better for everyone.

**Let's build the future of software development together!** 🚀

---

**Happy contributing!** ❤️

